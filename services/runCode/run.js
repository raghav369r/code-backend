const prisma = require("../../client/prisma");

const headers = {
  Authorization: process.env.GLOT_API_KEY,
  "Content-type": "application/json",
};

const runCode = async (input) => {
  const { code, language, problemId, stdin } = input;
  var problemExamples = null,
    input = "";
  if (problemId) {
    problemExamples = await prisma.example.findMany({ where: { problemId } });
    input = `${problemExamples.length}`;
    problemExamples.forEach((example) => {
      input += ` ${example.input}`;
    });
  }

  const data = {
    stdin: (problemId ? input : stdin) || "",
    files: [
      {
        name: `main.${language}`,
        content: code,
      },
    ],
  };
  const url = `https://glot.io/api/run/${
    language == "py" ? "python" : language
  }/latest`;
  var res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    res = await res.json();
  } catch (ex) {
    console.log(ex);
    return {
      stdout: "",
      stderr: "",
      error: "server Error try again later!",
      testCasesResult: [false, false, false],
    };
  }
  var testCasesResult = [];
  var outputArray = res.stdout.split("\n");

  problemExamples?.forEach((example, ind) => {
    if (example.output.trim() === outputArray[ind]?.trim()) {
      testCasesResult.push(true);
    } else testCasesResult.push(false);
  });
  var expectedOutput = "";
  const errInd = testCasesResult.indexOf(false);
  if (errInd != -1) {
    expectedOutput = problemExamples[errInd].output.trim();
    input = problemExamples[errInd].input;
  }
  return {
    ...res,
    testCasesResult,
    testcaseOutput: outputArray,
    input,
    expectedOutput,
  };
};

const runTestCases = async (pinput) => {
  const { code, language, problemId } = pinput;
  if (!problemId) throw new Error("can run testcses");
  const testCase = await prisma.testCase.findFirst({
    where: { problemId },
  });
  if (!testCase) throw new Error("No test cases exist");
  const { input, output } = testCase || {};
  const expected = output.split("\n");
  const inputArray = input.split("\n");
  const data = {
    stdin: input.length + " " + input || "",
    files: [
      {
        name: `main.${language}`,
        content: code,
      },
    ],
  };
  const url = `https://glot.io/api/run/${
    language == "py" ? "python" : language
  }/latest`;
  var res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    res = await res.json();
  } catch (ex) {
    console.log(ex);
    return {
      stdout: "",
      stderr: "",
      error: "server Error try again later!",
      testCasesResult: [],
    };
  }
  const outputArray = res.stdout.split("\n");
  if (expected.at(-1) == "") expected.pop();
  if (outputArray.at(-1) == "") outputArray.pop();
  let total = expected.length,
    passed = 0,
    errorind = -1;
  expected.forEach((op, ind) => {
    if (op.trim() != outputArray[ind]?.trim()) {
      if (errorind == -1) errorind = ind;
    } else passed++;
  });
  return {
    ...res,
    total,
    passed,
    errorDetails: res.stderr,
    input: inputArray?.[errorind] || "",
    output: outputArray?.[errorind] || "",
    expectedOutput: expected?.[errorind] || "",
  };
};

module.exports = { runCode, runTestCases };
