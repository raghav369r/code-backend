const prisma = require("../client/prisma");
const bcrypt = require("bcrypt");
const { sign_token } = require("../services/jwt/jwt");

const mutaions = {
  registerUser: async (_, { newUser }) => {
    const { firstName, lastName, password, email } = newUser;
    const exist = await prisma.user.findFirst({ where: { email } });
    if (exist) throw new Error("User with email already exist!!");
    const hashed = await bcrypt.hash(password);
    const user = await prisma.user.create({
      data: { firstName, lastName, password: hashed, email },
    });
    const token = await sign_token({ id: user.id, email, firstName });
    return token;
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
    return contest;
  },
  submitCode: async (_, { code }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const isAccepted = true; //runcode and find if any errors if error set error field
    const errorDetails = null;
    const submit = await prisma.userSubmissions.create({
      data: {
        userId: user.id,
        problemId: code.problemId,
        code: code.code,
        language: code.language,
        isInContest: code.incontest,
        errorDetails,
      },
    });
    return submit;
  },
};

const quary = {
  loginUser: async (_, { email, password }) => {
    const hashed = await bcrypt.hash(password);
    const user = prisma.user.findFirst({ where: { email, password: hashed } });
    if (!user)
      throw new Error("user with given email and password does't exist!!");
    const token = sign_token({ id: user.id, email, firstName: user.firstName });
    return token;
  },
  getAllProblems: async (_, {}, { user }) => {
    const problems = await prisma.problem.findMany();
    return problems;
  },
  getProblem: async (_, {}, { user }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
  },
  runCode: async (_, { input }, { user }) => {
    // if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const { code, language, problemId } = input;
    const res = {
      //post to glot and check output
      stdout: "ok done running",
      error: "",
      stderror: "",
      testCasesResult: [true, false, true],
    };
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
        contestQuestions,
        _count,
      },
    });
    console.log(contest);
    return contest.contestQuestions;
  },
  getAllregistered: async (_, { contestId }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { id: contestId },
      include: { registered, _count },
    });
    console.log(contest);
    return contest.registered;
  },
  getAllSubmissions: async (_, { userId }) => {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: { _count, userSubmissions },
    });
    console.log(user);
    return user.userSubmissions;
  },
  getAllParticipatedContests: async (_, __, { user }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const userDet = await prisma.user.findFirst({
      where: { id: user.id },
      include: { registered },
    });
    console.log(userDet);
    return userDet.registered;
  },
  getAllOrganisedContests: async (_, __, { user }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const organised = await prisma.contest.findMany({
      where: { OR: [{ owner: user.id }, { mediators: { contains: user.id } }] },
    });
    console.log(organised);
    return organised;
  },
  getContestRankings: async (_, { contestId }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { id: contestId },
      include: { registered, _count },
    });
    // run an ranking function to calculate rankings
    console.log(contest);
    return contest.registered;
  },
};

const typeResovers = {};

module.exports = { mutaions, quary, typeResovers };
