const prisma = require("../../client/prisma");

// const data = {
//   title: "",
//   description: startDescription,
//   difficulty: "Medium",
//   topics: "",
//   createdAt: "",
//   examples: [
//     {
//       input: "",
//       output: "",
//       explanation: "",
//     },
//   ],
//   testCases: "",
// };
const validateProblem = (formData) => {
  const { title, description, createdAt, examples, testCases } = formData;
  let errors = [];
  if (description == "")
    errors.push("Description can't ne empty or unmodifies!!");
  if (title.length <= 4) errors.push("Title can't be less than 4 chars");
  const addDate = new Date(createdAt);
  if (new Date() - addDate > 10000)
    errors.push("Add Date must be some time in future!!");
  examples.forEach((example) => {
    if (example.output == "") {
      errors.push("output in example can't be empty!!");
      return errors;
    }
  });
  return errors.length ? errors : null;
};

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
    title,
    createdAt,
  } = ele;
  try {
    const problem = await prisma.problem.create({
      data: {
        description,
        difficulty,
        startCode: "",
        topics,
        solutionCode: "",
        constraints: "",
        expectedComplexity: "",
        createdBy: userId,
        title,
        createdAt: new Date(createdAt),
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

module.exports = { addNewProblem, validateProblem };

// <!-- Title of the Problem -->
// # Two sum

// <!-- Description of the Problem -->
// Given an array `nums` of length n and  an integter `target` print true if there are two distinct indices i, j in nums such that nums[i] + nums[j] = traget.
// <!-- input Format -->
// #### Input Format:

// - first line contains no of test cases t
// - for each test case t given n length of array follwed by n integers i.e elements of array nums

// <!-- OutPut Format -->
// #### OutPut Format:

// - for each test case print true if there is an pair else false
// - print output of each test case in new line

// #### Constraints:

// - [ ] `1<t<100000`
// - [ ] `1<n<100000`
// - [ ] `0<=nums[i]<100000`
