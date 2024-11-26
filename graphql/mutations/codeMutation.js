const prisma = require("../../client/prisma");
const { runCode, runTestCases } = require("../../services/runCode/run");

const mutations = {
  // Not checked if the user is blocked from contest incase of contest submission
  // user will provide problemId, contestURL
  // if(contestURL) problem solved in contest
  // else solved from problem table
  // if(solved incontest)
  //    check if user registered,
  //    check if contest contain that problem,
  //    check if contest is not yet ended,
  //    check user is not blocked or ended his/her contest
  submitCode: async (_, { input }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const currentTime = new Date();
    var isAccepted = false;
    var errorDetails = "";
    const res = await runCode(input);
    // console.log("runned: ", res);
    errorDetails = res.stderr || res.error;
    const errorIndex = res.testCasesResult.indexOf(false);
    if (errorIndex == -1) isAccepted = true;
    else errorDetails += ` Error at test case ${errorIndex}`;

    let contest;
    if (input.contestUrl)
      contest = await prisma.contest.findFirst({
        where: { url: input.contestUrl },
        include: { contestQuestions: true },
      });
    const { id: contestId, endTime, startTime } = contest || {};
    let testCaseResult;
    if (isAccepted) {
      testCaseResult = await runTestCases(input);
      // console.log("test result:", testCaseResult);
      isAccepted = testCaseResult?.passed == testCaseResult?.total;
    }
    if (isAccepted) {
      const alreadyDone = await prisma.userSubmissions.findFirst({
        where: {
          AND: {
            userId: user.id,
            problemId: input.problemId,
            isAccepted: true,
          },
        },
      });
      if (!alreadyDone) {
        try {
          const data = await prisma.problemsSolved.update({
            where: { userId: user.id },
            data: { [input.language]: { increment: 1 } },
          });
        } catch (ex) {
          console.log(ex.message);
        }
      }
    }
    const {
      total,
      passed,
      errorDetails: errde,
      input: testInput,
      output,
      expectedOutput,
    } = testCaseResult || {};
    if (!errorDetails) errorDetails = " " + errde || "Wrong Answer";
    // console.log("Error details: ",errorDetails);
    const submit = await prisma.userSubmissions.create({
      data: {
        userId: user.id,
        problemId: input.problemId,
        code: input.code,
        language: input.language,
        isInContest: !!contestId,
        errorDetails: errorDetails,
        isAccepted: isAccepted,
        output:
          output || errorIndex != -1 ? res?.testcaseOutput?.[errorIndex] : "",
        expectedOutput: expectedOutput || res.expectedOutput,
        input: testInput || res.input,
        passed: passed || 0,
        total: total || -1,
      },
    });
    if (!input.contestUrl)
      return { ...submit, testCasesResult: res.testCasesResult };
    if (!contestId) throw new Error("Invalid contest URL");
    // checking if solving in contest
    if (contestId) {
      // check contest is not ended yet
      if (
        new Date(startTime) >= currentTime &&
        new Date(endTime) <= currentTime
      )
        throw new Error("Contest is Not started Yet!!");
      const ind = contest.contestQuestions.findIndex(
        (ele) => ele.problemId == input.problemId
      );
      // check if problem is from this contest
      if (ind == -1) throw new Error("problem is not from this Contest!!");
      // check if user registered
      const registered = await prisma.contestPerformance.findFirst({
        where: { AND: { contestId, userId: user.id } },
      });
      if (!registered) throw new Error("Your not registered to this contest!!");
      if (registered.isBlocked)
        throw new Error("Your blocked for this contest!!");
      // if(registered.isEnded) throw new Error("Your ended this contest!!");
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

    return {
      ...submit,
      testCasesResult: res.testCasesResult,
    };
  },
};

module.exports = mutations;
