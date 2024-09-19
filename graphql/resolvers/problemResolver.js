const prisma=require("../../client/prisma");

const resolvers = {
  findProblem: async (_, { title }) => {
    const problems = await prisma.problem.findMany({
      where: { title: { contains: title } },
      take: 10,
    });
    return problems;
  },
  getProblemSubmissions: async (
    _,
    { problemId, Pagination },
    { user, isAuthenticated }
  ) => {
    const { page, limit } = Pagination || {};
    if (page == -1) throw new Error("Invalid Page Number!!");
    const offSet = ((page || 1) - 1) * (limit || 10);
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const res = await prisma.userSubmissions.findMany({
      where: { AND: [{ problemId }, { userId: user.id }] },
      orderBy: [{ submittedAt: "desc" }],
      skip: offSet,
      take: limit || 10,
    });
    return res;
  },

  getAllProblems: async (_, { Pagination }, { user }) => {
    const { page, limit } = Pagination || {};
    if (page == -1) throw new Error("Invalid Page Number!!");
    const offSet = ((page || 1) - 1) * (limit || 10);
    const currentTime = new Date();
    const problems = await prisma.problem.findMany({
      where: { createdAt: { lte: currentTime } },
      // orderBy: { createdAt: "desc" },
      skip: offSet,
      take: limit || 10,
    });
    return problems;
    // const problems = await prisma.problem.findMany();
    // const filproblems = problems?.filter(
    //   (prob) => new Date(prob.createdAt) <= new Date()
    // );
    // return filproblems;
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
    // if (isBlocked?.isBlocked) throw new Error("your kicked from the contest!!");
    return problem;
  },

  getAllSubmissions: async (_, { userId, Pagination }) => {
    const { page, limit } = Pagination || {};
    if (page == -1) throw new Error("Invalid Page Number!!");
    const offSet = ((page || 1) - 1) * (limit || 10);
    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        userSubmissions: {
          include: { problem: true },
          orderBy: [{ submittedAt: "desc" }],
          skip: offSet,
          take: limit || 10,
        },
      },
    });
    return user.userSubmissions;
  },
};

module.exports= resolvers;
