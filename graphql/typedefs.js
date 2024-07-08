const { gql } = require("apollo-server-express");

const typedefs = gql`
  scalar Date

  type User {
    id: ID
    firstName: String
    lastName: String
    userName: String
    email: String
    password: String
    createdAt: Date
    profileLink: String
    linkedinLink: String
    githubLink: String
    instagramLink: String
    portfolioLink: String
    # registered: [Registered]  #####
    # userSubmissions: [UserSubmission] #####
  }

  type Problem {
    id: ID
    title: String
    description: String
    difficulty: String
    startCode: String
    topics: String
    solutionCode: String
    createdAt: Date
    createdBy: String
    constraints: String
    expectedComplexity: String
    examples: [Example]
    # contestQuestions: [ContestQuestion]
    # userSubmissions: [UserSubmission]
    # testCases: [TestCase]
  }

  type TestCase {
    id: ID
    problemId: ID
    input: String
    output: String
    # problem: Problem
  }

  type Example {
    id: ID
    input: String
    output: String
    explanation: String
    # problem: Problem
    problemId: ID
  }

  type Contest {
    id: ID
    name: String
    url: String
    startTime: Date
    endTime: Date
    owner: String
    mediators: String
    organisation: String
    contestQuestions: [ContestQuestion]
    # registered: [Registered]
  }

  type ContestQuestion {
    id: ID
    # contest: Contest
    contestId: ID
    problem: Problem
    problemId: ID
  }

  type Registered {
    id: ID
    user: User
    userId: ID
    contest: Contest
    contestId: ID
    registeredAt: String
  }

  type UserSubmission {
    id: ID
    # user: User
    userId: ID
    problem: Problem
    problemId: ID
    isAccepted: Boolean
    isInContest: Boolean
    errorDetails: String
    submittedAt: Date
    code: String
    language: String
    inputCase: String
    output: String
    expectedOutput: String
    testCasesResult: [Boolean]
  }
  input submitInput {
    code: String
    problemId: ID
    inContest: Boolean
    language: String
    contestId: String
  }
  input userInput {
    email: String
    password: String
    userName: String
    # firstName: String
    # lastName: String
  }
  type Auth {
    token: String!
    user: User
  }
  type runOutput {
    stdout: String
    error: String
    stderr: String
    testCasesResult: [Boolean]
    testcaseOutput: [String]
  }
  input codeInput {
    code: String
    language: String
    problemId: String
    stdin: String
  }
  type ProblemTable {
    id: ID
    title: String
    description: String
    difficulty: String
    topics: String
    createdAt: Date
    createdBy: String
  }
  type contestName {
    ok: Boolean
    error: String
  }
  type getContestsOutput {
    upComing: [Contest]
    pastParticipated: [Contest]
    registered: [Contest]
  }
  type Query {
    isContestNameAvailable(contestName: String!): contestName
    getUser: User!
    loginUser(email: String!, password: String!): Auth!
    getAllProblems: [ProblemTable]
    getProblem(id: ID!): Problem
    runCode(input: codeInput): runOutput
    isRigistered(contestId: ID!): Boolean
    getContestDetails(contestUrl: String!): Contest
    getContestProblems(contestURL: String!): Contest
    getAllregistered(contestId: ID!): [User]
    getAllSubmissions(userId: ID!): [UserSubmission]
    getAllParticipatedContests: [Contest]
    getAllOrganisedContests: [Contest]
    getContestRankings: [User]
    getContests: getContestsOutput
    getProblemSubmissions(problemId: ID!): [UserSubmission]
  }
  input problemInput {
    description: String
    difficulty: String
    startCode: String
    topics: String
    solutionCode: String
    constraints: String
    expectedComplexity: String
    examples: [exampleInput]
    title: String
  }
  input exampleInput {
    input: String
    output: String
    explanation: String
  }
  input contestInput {
    name: String
    url: String
    startTime: Date
    endTime: Date
    mediators: String
    organisation: String
    contestQuestions: [problemInput]
  }
  input minput {
    id: String
    firstName: String
    lastName: String
    userName: String
    profileLink: String
    linkedinLink: String
    githubLink: String
    instagramLink: String
    portfolioLink: String
  }
  type Mutation {
    registerUser(newUser: userInput): Auth!
    registerToContest(contestId: ID!): Contest
    submitCode(input: submitInput): UserSubmission
    # addExample():ID!
    # addProblem():ID!
    addContest(newContest: contestInput): Contest
    addProblem(newProblem: problemInput): Problem
    editProfile(input: minput): User!
    blockUser(contestId: ID!): Boolean
  }
`;

module.exports = { typedefs };
