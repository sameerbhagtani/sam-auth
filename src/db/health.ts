import { pool } from "./index.js";

export default async function verifyDatabaseConnection() {
    await pool.query("SELECT 1");
}
