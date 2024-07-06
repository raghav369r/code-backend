const { gql } = require("apollo-server-express");

const typedefs = gql`
  type User {
    id: ID
    firstName: String
    lastName: String
    userName: String
    email: String
    password: String
    createdAt: String
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
    createdAt: String
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
    startTime: String
    endTime: String
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
    # problem: Problem
    problemId: ID
    isAccepted: Boolean
    isInContest: Boolean
    errorDetails: String
    submittedAt: String
    code: String
    language: String
  }
  input submitInput {
    code: String
    problemId: ID
    inContest: Boolean
    language: String
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
    createdAt: String
    createdBy: String
  }
  type contestName {
    ok: Boolean
    error: String
  }
  type Query {
    isContestNameAvailable(contestName: String!): contestName
    getUser: User!
    loginUser(email: String!, password: String!): Auth!
    getAllProblems: [ProblemTable]
    getProblem(id: ID!): Problem
    runCode(input: codeInput): runOutput

    getContestDetails(contestId: ID!): Contest
    getContestProblems(contestId: ID!): Contest
    getAllregistered(contestId: ID!): [User]
    getAllSubmissions(userId: ID!): [UserSubmission]
    getAllParticipatedContests: [Contest]
    getAllOrganisedContests: [Contest]
    getContestRankings: [User]
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
  }
  input exampleInput {
    input: String
    output: String
    explanation: String
  }
  input contestInput {
    name: String
    url: String
    startTime: String
    endTime: String
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
  }
`;

module.exports = { typedefs };
