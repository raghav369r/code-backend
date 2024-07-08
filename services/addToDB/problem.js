const prisma = require("../../client/prisma");

const addNewProblem = async (ele, userId) => {
  const {
    description,
    difficulty,
    startCode,
    topics,
    solutionCode,
    constraints,
    expectedComplexity,
    examples,
    title
  } = ele;
  try {
    const problem = await prisma.problem.create({
      data: {
        description,
        difficulty,
        startCode,
        topics,
        solutionCode,
        constraints,
        expectedComplexity,
        createdBy: userId,
        title
      },
    });
    await Promise.all(
      examples.map(async (ele) => {
        await prisma.example.create({
          data: { ...ele, problemId: problem.id },
        });
      })
    );
    return problem;
  } catch (ex) {
    console.log(ex);
    throw new Error("error creating New problem!!");
  }
};

module.exports = { addNewProblem };
