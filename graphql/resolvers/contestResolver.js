const prisma = require("../../client/prisma");

const resolvers = {
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

  getContestDetails: async (_, { contestUrl }, { user }) => {
    const contest = await prisma.contest.findFirst({
      where: { url: contestUrl },
    });
    if (!contest) throw new Error("No contest exist with this page!!");
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
    if (contest.owner == user.id) return contest;
    if (currTime > new Date(contest.startTime) && currTime < contest.endTime) {
      const cperformence = await prisma.contestPerformance.findFirst({
        where: { AND: [{ userId: user.id }, { contestId: contest.id }] },
      });
      if (!cperformence) throw new Error("Your not registerd to contest!!");
      if (cperformence?.isBlocked) throw new Error("blocked");
      if (cperformence?.isJoined) throw new Error("already isJoined");
      await prisma.contestPerformance.updateMany({
        where: { AND: [{ userId: user.id }, { contestId: contest.id }] },
        data: { isJoined: true },
      });
    }
    return contest;
  },

  getAllregistered: async (_, { contestUrl, Pagination }, { user }) => {
    const { page, limit } = Pagination || {};
    if (page == -1) throw new Error("Invalid Page Number!!");
    const offSet = ((page || 1) - 1) * (limit || 10);
    const con = await prisma.contest.findFirst({ where: { url: contestUrl } });
    const contest = await prisma.registered.findMany({
      where: { contestId: con.id },
      include: { user: true },
      orderBy: { registeredAt: "desc" },
      skip: offSet,
      take: limit || 10,
    });
    const res = contest.map((ele) => ele.user);
    return res;
  },

  getContestRankings: async (_, { contestUrl, Pagination }, { user }) => {
    const { page, limit } = Pagination || {};
    if (page == -1) throw new Error("Invalid Page Number!!");
    const offSet = ((page || 1) - 1) * (limit || 10);
    const contest = await prisma.contest.findFirst({
      where: { url: contestUrl },
    });
    const rankings = await prisma.contestPerformance.findMany({
      where: { contestId: contest.id },
      orderBy: [{ score: "desc" }, { lastSubmitted: "asc" }],
      include: { User: true },
      skip: offSet,
      take: limit || 10,
    });
    return rankings;
  },
};

module.exports = resolvers;
