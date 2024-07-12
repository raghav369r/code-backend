const prisma = require("../../client/prisma");

const headers = {
  Authorization: process.env.GLOT_API_KEY,
  "Content-type": "application/json",
};

const runCode = async (input) => {
  const { code, language, problemId, stdin } = input;
  var problemExamples = null,
    input = "",
    output = "";
  if (problemId) {
    problemExamples = await prisma.example.findMany({ where: { problemId } });
    input = `${problemExamples.length}`;
    problemExamples.forEach((example) => {
      input += ` ${example.input}`;
      output += ` ${example.output}`;
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
  // console.log(res);
  var testCasesResult = [];
  var outputArray = res.stdout.split("\n");

  problemExamples?.forEach((example, ind) => {
    // console.log(outputArray[ind]?.trim());
    if (example.output.trim() === outputArray[ind]?.trim()) {
      testCasesResult.push(true);
    } else testCasesResult.push(false);
  });
  var expectedOutput = "";
  const errInd = testCasesResult.findIndex(false);
  if (errInd != -1) expectedOutput = problemExamples[errInd].output.trim();
  return {
    ...res,
    testCasesResult,
    testcaseOutput: outputArray,
    expectedOutput,
  };
};

module.exports = { runCode };
