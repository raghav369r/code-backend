const prisma=require("../../client/prisma");
const { addNewProblem } = require("../../services/addToDB/problem");
const { scheduleEmail } = require("../../services/mailService/mail");

const mutations={
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
    scheduleEmail(user?.email, contestInfo?.startTime, contestInfo?.url);
    await prisma.contestPerformance.create({
      data: { contestId, userId: user.id },
    });
    return contest;
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
}

module.exports=mutations;