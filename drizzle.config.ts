import env from "./src/config/env.js";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",

    schema: "./src/db/schema.ts",
    out: "./drizzle",

    dbCredentials: {
        url: env.DATABASE_URL,
    },
});
