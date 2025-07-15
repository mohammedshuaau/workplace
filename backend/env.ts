import { parseEnv, port, z } from "znv";
import * as dotenv from "dotenv";
import * as fs from "fs";

// All environment variables you put in .env file should be defined here
export const environmentSchema = {
  DATABASE_URL: z.string().url(),
  HTTP_PORT: port().default(4000),
  JWT_SECRET: z.string().min(10),
  MATTERMOST_SERVER_URL: z.string().url().optional(),
  MATTERMOST_ADMIN_TOKEN: z.string().optional(),
  MATTERMOST_DEFAULT_TEAM: z.string().optional(),
};

// After defining the schema, export them here so you can use them in your app
// Refer to main.ts to see usage
export const {
  DATABASE_URL,
  HTTP_PORT,
  JWT_SECRET,
  MATTERMOST_SERVER_URL,
  MATTERMOST_ADMIN_TOKEN,
  MATTERMOST_DEFAULT_TEAM,
} = parseEnv(dotenv.parse(fs.readFileSync(".env")), environmentSchema); 