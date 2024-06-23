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
    stdin: problemId ? input : stdin,
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
      testCasesResult: [true, false, true],
    };
  }
  var testCasesResult = [];
  var outputArray = res.stdout.split("\n");

  problemExamples.forEach((example, ind) => {
    if (example.output.trim() === outputArray[ind].trim())
      testCasesResult.push(true);
    else testCasesResult.push(false);
  });
  return { ...res, testCasesResult };
};

module.exports = { runCode };
