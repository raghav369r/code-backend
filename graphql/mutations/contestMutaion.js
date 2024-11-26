const prisma = require("../../client/prisma");
const { addNewProblem } = require("../../services/addToDB/problem");
const { scheduleEmail } = require("../../services/mailService/mail");

const mutations = {
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
    if (!user?.organisation) throw new Error("Not Autherisesed!!");
    const exist = await prisma.contest.findFirst({
      where: { url: newContest.url },
    });
    if (exist) throw new Error("name Alreay exist");
    const { name, url, startTime, endTime, contestQuestions } = newContest;
    if (new Date(startTime) < new Date())
      throw new Error("startDate must be in future!");
    if (new Date(startTime) > new Date(endTime))
      throw new Error("endDate must be after startDate!");
    try {
      const contest = await prisma.contest.create({
        data: {
          owner: user.id,
          url,
          name,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          mediators: "",
          organisation: user?.name,
        },
      });
      const added = await prisma.contestQuestions.createMany({
        data: contestQuestions.map((ele) => ({
          contestId: contest.id,
          problemId: ele,
        })),
      });
    } catch (ex) {
      throw new Error(ex.message);
    }
    return newContest;
  },
  addProblem: async (_, { newProblem }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    if (!user?.organisation) throw new Error("Not Autherisesed!!");

    // \n new line
    // \\n \n inside code
    const { testcases } = newProblem;
    const testcaselines = testcases.split("\n");
    !testcaselines.at(-1) && testcaselines.pop();
    if (testcaselines.length % 2) throw Error("Test cases are not balenced!!");
    const nprob = await addNewProblem(newProblem, user.id);
    let inputstr = "",
      outputstr = "";
    testcaselines.forEach((ele, ind) => {
      if (ind % 2 == 0) inputstr += ele + "\n";
      else outputstr += ele + "\n";
    });
    try {
      const res = await prisma.testCase.create({
        data: { input: inputstr, output: outputstr, problemId: nprob.id },
      });
    } catch (ex) {
      console.log(ex.message);
    }
    return nprob;
  },
};

module.exports = mutations;
