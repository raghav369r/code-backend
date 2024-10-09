const { gql } = require("apollo-server-express");
const prisma = require("../client/prisma");

const typedefs = gql`
  scalar Date

  type User {
    id: ID
    firstName: String
    lastName: String
    userName: String
    email: String
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
  }

  type Example {
    id: ID
    input: String
    output: String
    explanation: String
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
  type ContestDetails {
    id: ID
    name: String
    url: String
    startTime: Date
    endTime: Date
    owner: String
    mediators: String
    organisation: String
  }
  type ContestQuestion {
    id: ID
    contestId: ID
    problemId: ID
    problem: Problem
    # contest: Contest
  }

  type Registered {
    id: ID
    user: User
    userId: ID
    contestId: ID
    registeredAt: String
  }

  type UserSubmission {
    id: ID
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
    problemId: ID!
    language: String!
    contestUrl: String
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
    status: String
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
  type ContestPerformance {
    id: String
    userId: String
    contestId: String
    lastSubmitted: Date
    isJoined: Boolean
    isBlocked: Boolean
    score: Int
    User: User
  }
  input Pagination {
    page: Int
    limit: Int
  }
  type Query {
    isContestNameAvailable(contestName: String!): contestName
    getUser(userId: ID): User!
    loginUser(email: String!, password: String!): Auth!
    getAllProblems(Pagination: Pagination): [ProblemTable]
    getProblem(id: ID!): Problem
    runCode(input: codeInput): runOutput
    isRigistered(contestId: ID!): Boolean
    getContestDetails(contestUrl: String!): ContestDetails
    getContestProblems(contestURL: String!): Contest
    getAllregistered(contestUrl: String!, Pagination: Pagination): [User]
    getAllSubmissions(userId: ID!, Pagination: Pagination): [UserSubmission]
    getAllParticipatedContests(userId: ID!, Pagination: Pagination): [Contest]
    getAllOrganisedContests(Pagination: Pagination): [Contest]
    getContestRankings(
      contestUrl: String!
      Pagination: Pagination
    ): [ContestPerformance]
    getContests: getContestsOutput
    getProblemSubmissions(
      problemId: ID!
      Pagination: Pagination
    ): [UserSubmission]
    findProblem(title: String!): [Problem]
  }
  input problemInput {
    description: String
    difficulty: String
    # startCode: String
    topics: String
    # solutionCode: String
    # constraints: String
    # expectedComplexity: String
    examples: [exampleInput]
    title: String
    testcases: String
    createdAt: Date
  }
  input exampleInput {
    input: String
    output: String
    explanation: String
  }
  input contestInput {
    name: String!
    url: String!
    startTime: Date!
    endTime: Date!
    # mediators: String
    # organisation: String
    contestQuestions: [ID!]!
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
    addContest(newContest: contestInput): ContestDetails
    addProblem(newProblem: problemInput): Problem
    editProfile(input: minput): User!
    blockUser(contestId: ID!): Boolean
  }
`;

const typeResovers = {
  Problem: {
    examples: async (parent, {}, { user }) => {
      const examples = await prisma.example.findMany({
        where: { problemId: parent.id },
      });
      return examples;
    },
  },
  ProblemTable: {
    status: async (parent, {}, { user, isAuthenticated }) => {
      if (!isAuthenticated) return "none";
      const submitted = await prisma.userSubmissions.findMany({
        where: { userId: user.id, problemId: parent.id },
      });
      if (submitted?.length == 0) return "none";
      const accepted = submitted.findIndex((ele) => ele.isAccepted == true);
      if (accepted != -1) return "done";
      else return "try";
    },
  },
};

module.exports = { typedefs, typeResovers };
