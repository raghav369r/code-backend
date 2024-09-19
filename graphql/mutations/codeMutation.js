const prisma = require("../../client/prisma");
const { runCode } = require("../../services/runCode/run");

const mutations = {
  // Not checked if the user is blocked from contest incase of contest submission
  submitCode: async (_, { input }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const currentTime = new Date();
    var isAccepted = false;
    var errorDetails = "";
    const res = await runCode(input);
    errorDetails = res.stderr || res.error;
    const errorIndex = res.testCasesResult.indexOf(false);
    if (errorIndex == -1) isAccepted = true;
    else errorDetails += ` Error at test case ${errorIndex}`;

    const problemInfo = await prisma.problem.findFirst({
      where: { id: input.problemId },
    });
    const { id } = await prisma.contest.findFirst({
      where: { url: input.contestUrl },
    });

    const submit = await prisma.userSubmissions.create({
      data: {
        userId: user.id,
        problemId: input.problemId,
        code: input.code,
        language: input.language,
        isInContest: new Date(problemInfo.createdAt) > currentTime,
        errorDetails: errorDetails,
        isAccepted: isAccepted,
        inputCase: "" + errorIndex,
        output: errorIndex != -1 ? res?.testcaseOutput?.[errorIndex] : "",
        expectedOutput: res.expectedOutput,
      },
    });
    if (new Date(problemInfo.createdAt) > currentTime) {
      const already = await prisma.contestSubmissions.findFirst({
        where: {
          AND: [
            { contestId: id },
            { userId: user.id },
            { problemId: input.problemId },
            { isAccepted: true },
          ],
        },
      });
      const res = await prisma.contestSubmissions.create({
        data: {
          contestId: id,
          userId: user.id,
          problemId: input.problemId,
          isAccepted,
        },
      });
      if (!already && isAccepted) {
        const added = await prisma.contestPerformance.updateMany({
          data: { lastSubmitted: currentTime, score: { increment: 1 } },
          where: { AND: [{ contestId: id, userId: user.id }] },
        });
      }
    }

    return { ...submit, testCasesResult: res.testCasesResult };
  },
};

module.exports = mutations;
