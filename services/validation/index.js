import { z } from "zod";

const problemSchema = z.object({

});


//   id                 String             @id @default(auto()) @map("_id") @db.ObjectId
//   title              String
//   description        String
//   difficulty         String
//   startCode          String
//   topics             String
//   solutionCode       String
//   createdAt          DateTime           @default(now())
//   createdBy          String
//   constraints        String
//   expectedComplexity String
//   examples           Example[]          @relation("ProblemExamples")
//   contestQuestions   ContestQuestions[]
//   userSubmissions    UserSubmissions[]
//   testCases          TestCase[]