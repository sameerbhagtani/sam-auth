import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import path from "node:path";

import discoveryRoutes from "./discovery/discovery.routes.js";
import clientRoutes from "./client/client.routes.js";
import authRoutes from "./auth/auth.routes.js";
import authorizeRoutes from "./authorize/authorize.routes.js";
import tokenRoutes from "./token/token.routes.js";
import userinfoRoutes from "./userinfo/userinfo.routes.js";

import AppError from "../utils/AppError.js";
import errorHandler from "../middlewares/errorHandler.js";

export default function createServerApplication(): Application {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.use(express.static(path.join(process.cwd(), "src", "public")));

    app.set("view engine", "ejs");
    app.set("views", path.join(process.cwd(), "src", "views"));

    app.get("/", (req, res) => {
        return res.status(200).json({
            message: "SamAuth is working",
        });
    });

    app.use("/.well-known", discoveryRoutes);
    app.use("/clients", clientRoutes);
    app.use("/auth", authRoutes);
    app.use("/authorize", authorizeRoutes);
    app.use("/", tokenRoutes);
    app.use("/", userinfoRoutes);

    app.all("{*path}", (req, res) => {
        throw new AppError(`Route ${req.originalUrl} not found`, 404);
    });

    app.use(errorHandler);

    return app;
}
