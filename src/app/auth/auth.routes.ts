import { Router } from "express";
const router = Router();

import validate from "../../middlewares/validate.js";
import { registerSchema, loginSchema } from "./auth.schemas.js";
import { getSchema } from "../authorize/authorize.schemas.js";

import {
    getRegisterPage,
    getLoginPage,
    registerUser,
    loginUser,
} from "./auth.controller.js";

router.get("/register", validate(getSchema), getRegisterPage);
router.get("/login", validate(getSchema), getLoginPage);
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

export default router;
