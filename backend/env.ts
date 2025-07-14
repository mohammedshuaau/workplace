import { parseEnv, port, z } from "znv";
import * as dotenv from "dotenv";
import * as fs from "fs";

// All environment variables you put in .env file should be defined here
export const environmentSchema = {
  DATABASE_URL: z.string().url(),
  HTTP_PORT: port().default(4000),
  JWT_SECRET: z.string().min(10),
  MATRIX_SERVER_URL: z.string().url().default('http://dendrite:8008'),
  MATRIX_SHARED_SECRET: z.string().min(1),
};

// After defining the schema, export them here so you can use them in your app
// Refer to main.ts to see usage
export const {
  DATABASE_URL,
  HTTP_PORT,
  JWT_SECRET,
  MATRIX_SERVER_URL,
  MATRIX_SHARED_SECRET,
} = parseEnv(dotenv.parse(fs.readFileSync(".env")), environmentSchema); 