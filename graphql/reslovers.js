const prisma = require("../client/prisma");
const bcrypt = require("bcrypt");
const { sign_token } = require("../services/jwt/jwt");
const { addNewProblem } = require("../services/addToDB/problem");
const { runCode } = require("../services/runCode/run");
require("dotenv").config();

const ROUNDS = process.env.SALT_ROUNDS || 10;
const mutaions = {
  editProfile: async (_, { input }, { user, isAthenticated }) => {
    if (!isAthenticated) throw new Error("Missing token or expired Token!!");
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
    console.log(muser);
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
  registerToContest: async (_, { contestId }, { user, isAthenticated }) => {
    if (!isAthenticated) throw new Error("Missing token or expired Token!!");
    const exist = await prisma.registered.findFirst({
      where: { AND: [{ userId: user.id }, { contestId }] },
    });
    if (exist) throw new Error("Alredy Registerd!!");
    const contest = await prisma.registered.create({
      data: { userId: user.id, contestId },
    });
    return contest;
  },
  submitCode: async (_, { input }, { user, isAthenticated }) => {
    if (!isAthenticated) throw new Error("Missing token or expired Token!!");
    var isAccepted = false; //runcode and find if any errors if error set error field
    var errorDetails = "";
    const res = await runCode(input);
    errorDetails = res.stderr || res.error;
    console.log(errorDetails);
    const errorIndex = res.testCasesResult.indexOf(false);
    if (errorIndex == -1) isAccepted = true;
    else errorDetails += ` Error at test case ${errorIndex}`;
    const submit = await prisma.userSubmissions.create({
      data: {
        userId: user.id,
        problemId: input.problemId,
        code: input.code,
        language: input.language,
        isInContest: input.incontest ? true : false,
        errorDetails: errorDetails,
        isAccepted: isAccepted,
      },
    });
    return submit;
  },
  addContest: async (_, { newContest }, { user, isAthenticated }) => {
    if (!isAthenticated) throw new Error("Missing token or expired Token!!");
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
        const { id } = await addNewProblem(ele, user.id);
        return id;
      })
    );
    const contest = await prisma.contest.create({
      data: {
        name,
        url,
        startTime: new Date(),
        endTime: new Date(),
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
  addProblem: async (_, { newProblem }, { user, isAthenticated }) => {
    if (!isAthenticated) throw new Error("Missing token or expired Token!!");
    const nprob = await addNewProblem(newProblem, user.id);
    return nprob;
  },
};

const quary = {
  getUser: async (_, __, { user }) => {
    // console.log(user);
    if (!user?.id) return null;
    const nuser = await prisma.user.findFirst({ where: { id: user?.id } });
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
    return problems;
  },
  getProblem: async (_, {}, { user }) => {
    if (!isAthenticated) throw new Error("Missing token or expired Token!!");
  },
  runCode: async (_, { input }, { user }) => {
    const res = await runCode(input);
    return res;
  },
  getContestDetails: async (_, { contestId }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { id: contestId },
    });
    return contest;
  },
  getContestProblems: async (_, { contestId }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { id: contestId },
      include: {
        contestQuestions: { include: { problem: true } },
      },
    });
    return contest;
  },
  getAllregistered: async (_, { contestId }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { id: contestId },
      include: { registered: true },
    });
    console.log(contest);
    return contest.registered;
  },
  getAllSubmissions: async (_, { userId }) => {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: { userSubmissions: true },
    });
    console.log(user);
    return user.userSubmissions;
  },
  getAllParticipatedContests: async (_, __, { user }) => {
    if (!isAthenticated) throw new Error("Missing token or expired Token!!");
    const userDet = await prisma.user.findFirst({
      where: { id: user.id },
      include: { registered: true },
    });
    console.log(userDet);
    return userDet.registered;
  },
  getAllOrganisedContests: async (_, __, { user }) => {
    if (!isAthenticated) throw new Error("Missing token or expired Token!!");
    const organised = await prisma.contest.findMany({
      where: { OR: [{ owner: user.id }, { mediators: { contains: user.id } }] },
    });
    console.log(organised);
    return organised;
  },
  getContestRankings: async (_, { contestId }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { id: contestId },
      include: { registered: true },
    });
    // run an ranking function to calculate rankings
    console.log(contest);
    return contest.registered;
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
