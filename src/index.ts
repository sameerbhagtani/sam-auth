import http from "node:http";
import verifyDatabaseConnection from "./db/health.js";
import createServerApplication from "./app/index.js";
import { initJWKS } from "./config/jwks.js";
import env from "./config/env.js";

async function main() {
    try {
        await verifyDatabaseConnection();
        console.log(`✅ Database Connected`);

        await initJWKS();
        console.log(`✅ JWKS initialized`);

        const server = http.createServer(createServerApplication());
        const PORT = env.PORT;

        server.listen(PORT, () => {
            console.log(`✅ Server started on PORT: ${PORT}`);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
