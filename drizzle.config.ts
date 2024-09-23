import { config } from "dotenv";

config({ path: ".env.local" });

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  tablesFilter: ["regular-language-simulator_*"],
};