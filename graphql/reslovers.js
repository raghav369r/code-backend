const prisma = require("../client/prisma");
const bcrypt = require("bcrypt");
const { sign_token } = require("../services/jwt/jwt");
const { addNewProblem } = require("../services/addToDB/problem");
const { runCode } = require("../services/runCode/run");
const { scheduleEmail } = require("../services/mailService/mail");
require("dotenv").config();

const ROUNDS = process.env.SALT_ROUNDS || 10;
const mutaions = {
  blockUser: async (_, { contestId }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const res = await prisma.contestPerformance.updateMany({
      where: { AND: [{ userId: user?.id }, { contestId }] },
      data: {
        isBlocked: true,
      },
    });
    return true;
  },
  editProfile: async (_, { input }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const {
      id,
      firstName,
      lastName,
      userName,
      profileLink,
      linkedinLink,
      githubLink,
      instagramLink,
      portfolioLink,
    } = input;
    if (id != user.id) throw new Error("Your not Autherised!!");
    const muser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        userName,
        profileLink,
        linkedinLink,
        githubLink,
        instagramLink,
        portfolioLink,
      },
    });
    return muser;
  },
  registerUser: async (_, { newUser }) => {
    const { userName, password, email } = newUser;
    const exist = await prisma.user.findFirst({ where: { email } });
    if (exist) throw new Error("User with email already exist!!");
    const hashed = await bcrypt.hash(password, ROUNDS);
    var user = await prisma.user.create({
      data: { userName, password: hashed, email },
    });
    // console.log(user);
    const token = await sign_token({
      id: user.id,
      email,
      name: userName || user.firstName,
    });
    return { token, user };
  },
  registerToContest: async (_, { contestId }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const exist = await prisma.registered.findFirst({
      where: { AND: [{ userId: user.id }, { contestId }] },
    });
    if (exist) throw new Error("Alredy Registerd!!");
    const contest = await prisma.registered.create({
      data: { userId: user.id, contestId },
    });
    const contestInfo = await prisma.contest.findFirst({
      where: { id: contestId },
      select: { url: true, startTime: true },
    });
    // console.log(user?.email, contestInfo?.startTime, contestInfo?.url);
    scheduleEmail(user?.email, contestInfo?.startTime, contestInfo?.url);
    await prisma.contestPerformance.create({
      data: { contestId, userId: user.id },
    });
    return contest;
  },
  submitCode: async (_, { input }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    var isAccepted = false; //runcode and find if any errors if error set error field
    var errorDetails = "";
    const res = await runCode(input);
    errorDetails = res.stderr || res.error;
    const errorIndex = res.testCasesResult.indexOf(false);
    if (errorIndex == -1) isAccepted = true;
    else errorDetails += ` Error at test case ${errorIndex}`;
    const submit = await prisma.userSubmissions.create({
      data: {
        userId: user.id,
        problemId: input.problemId,
        code: input.code,
        language: input.language,
        isInContest: input.inContest ? true : false,
        errorDetails: errorDetails,
        isAccepted: isAccepted,
        inputCase: "" + errorIndex,
        output: errorIndex != -1 ? res?.testcaseOutput?.[errorIndex] : "",
        expectedOutput: "",
      },
    });
    if (input.inContest) {
      const res = await prisma.contestSubmissions.create({
        data: {
          contestId: input.contestId,
          userId: user.id,
          problemId: input.problemId,
          isAccepted,
        },
      });
    }
    
    return { ...submit, testCasesResult: res.testCasesResult };
  },
  addContest: async (_, { newContest }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const exist = await prisma.contest.findFirst({
      where: { url: newContest.url },
    });
    if (exist) throw new Error("name Alreay exist");
    const {
      name,
      url,
      startTime,
      endTime,
      mediators,
      organisation,
      contestQuestions,
    } = newContest;
    const pids = await Promise.all(
      contestQuestions.map(async (ele) => {
        const { id } = await addNewProblem(ele, user.id, endTime);
        return id;
      })
    );
    const contest = await prisma.contest.create({
      data: {
        name,
        url,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        owner: user.id,
        mediators,
        organisation,
      },
    });
    await prisma.contestQuestions.createMany({
      data: pids.map((ele) => ({ problemId: ele, contestId: contest.id })),
    });
    return contest;
  },
  addProblem: async (_, { newProblem }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const nprob = await addNewProblem(newProblem, user.id);
    return nprob;
  },
};

const quary = {
  getProblemSubmissions: async (
    _,
    { problemId },
    { user, isAuthenticated }
  ) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const res = await prisma.userSubmissions.findMany({
      where: { AND: [{ problemId }, { userId: user.id }] },
      orderBy: [{ submittedAt: "desc" }],
    });
    return res;
  },
  isRigistered: async (_, { contestId }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const res = await prisma.registered.findFirst({
      where: { AND: [{ contestId }, { userId: user?.id }] },
    });
    if (res) return true;
    else return false;
  },
  getContests: async (_, __, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const currentTime = new Date();
    const contests = await prisma.contest.findMany();
    var upComing,
      registered = [],
      pastParticipated = [];
    upComing = contests.filter((ele) => new Date(ele.startTime) > currentTime);
    pastParticipated = contests.filter(
      (ele) => new Date(ele.endTime) < currentTime
    );
    const res = await prisma.registered.findMany({
      where: { userId: user.id },
      include: { contest: true },
    });
    res.forEach(({ contest }) => {
      if (new Date(contest?.endTime) > currentTime) registered.push(contest);
    });
    return {
      upComing,
      registered,
      pastParticipated,
    };
  },
  isContestNameAvailable: async (
    _,
    { contestName },
    { user, isAuthenticated }
  ) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const pattern = /^[a-zA-Z0-9-]+$/;
    const res = pattern.test(contestName);
    if (!res)
      return {
        ok: false,
        error: "can only contain alphanumeric and - chrecters",
      };
    const contest = await prisma.contest.findFirst({
      where: { name: contestName },
    });
    if (contest)
      return {
        ok: false,
        error: "name already taken try other name",
      };
    return { ok: true, error: "" };
  },
  getUser: async (_, { userId }, { user }) => {
    if (!userId && !user?.id) return null;
    const nuser = await prisma.user.findFirst({
      where: { id: userId || user?.id },
    });
    return nuser;
  },
  loginUser: async (_, { email, password }) => {
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) throw new Error("no user exist with given email!!");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password!!");
    const token = sign_token({ id: user.id, email, firstName: user.firstName });
    return { token, user };
  },
  getAllProblems: async (_, {}, { user }) => {
    const problems = await prisma.problem.findMany();
    const filproblems = problems?.filter(
      (prob) => new Date(prob.createdAt) <= new Date()
    );
    return filproblems;
  },
  getProblem: async (_, { id }, { user, isAuthenticated }) => {
    const problem = await prisma.problem.findFirst({ where: { id } });
    if (new Date(problem.createdAt) < new Date()) return problem;
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const isBlocked = await prisma.contestPerformance.findFirst({
      where: {
        AND: [{ isBlocked: true }, { userId: user.id }],
      },
    });
    if (isBlocked?.isBlocked) throw new Error("your kicked from the contest!!");
    return problem;
  },
  runCode: async (_, { input }, { user }) => {
    const res = await runCode(input);
    return res;
  },
  getContestDetails: async (_, { contestUrl }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { url: contestUrl },
    });
    return contest;
  },
  getContestProblems: async (_, { contestURL }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");

    const contest = await prisma.contest.findFirst({
      where: { url: contestURL },
      include: {
        contestQuestions: { include: { problem: true } },
      },
    });
    const currTime = new Date();
    if (currTime > new Date(contest.startTime) && currTime < contest.endTime) {
      const cperformence = await prisma.contestPerformance.findFirst({
        where: { AND: [{ userId: user.id }, { contestId: contest.id }] },
      });
      if (cperformence?.isBlocked) throw new Error("blocked");
      if (cperformence?.isJoined) throw new Error("already isJoined");
      await prisma.contestPerformance.updateMany({
        where: { AND: [{ userId: user.id }, { contestId: contest.id }] },
        data: { isJoined: true },
      });
    }
    return contest;
  },
  getAllregistered: async (_, { contestUrl }, { user }) => {
    const con = await prisma.contest.findFirst({ where: { url: contestUrl } });
    const contest = await prisma.registered.findMany({
      where: { contestId: con.id },
      include: { user: true },
    });
    const res = contest.map((ele) => ele.user);
    return res;
  },
  getAllSubmissions: async (_, { userId }) => {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        userSubmissions: {
          include: { problem: true },
          orderBy: [{ submittedAt: "desc" }],
        },
      },
    });
    return user.userSubmissions;
  },
  getAllParticipatedContests: async (
    _,
    { userId },
    { user, isAuthenticated }
  ) => {
    // if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const userDet = await prisma.user.findFirst({
      where: { id: userId },
      include: { registered: { include: { contest: true } } },
    });
    let pastContests = [];
    userDet?.registered?.forEach(({ contest }) => {
      if (new Date(contest.endTime) >= new Date()) pastContests.push(contest);
    });
    return pastContests;
  },
  getAllOrganisedContests: async (_, __, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const organised = await prisma.contest.findMany({
      where: { owner: user.id },
      // where: { OR: [{ owner: user.id }, { mediators: { contains: user.id } }] },
    });
    return organised;
  },
  getContestRankings: async (_, { contestUrl }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { url: contestUrl },
      include: { registered: true },
    });
    // run an ranking function to calculate rankings
    return contest.registered || [];
  },
};

const typeResovers = {
  Problem: {
    examples: async (parent, {}, { user }) => {
      const examples = await prisma.example.findMany({
        where: { problemId: parent.id },
      });
      return examples;
    },
  },
};

module.exports = { mutaions, quary, typeResovers };
