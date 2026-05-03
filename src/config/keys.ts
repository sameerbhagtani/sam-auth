import fs from "fs";
import path from "path";

const certPath = path.join(process.cwd(), "cert");

export const privateKey = fs.readFileSync(
    path.join(certPath, "private-key.pem"),
    "utf8",
);

export const publicKey = fs.readFileSync(
    path.join(certPath, "public-key.pub"),
    "utf8",
);
