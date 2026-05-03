import { Router } from "express";
const router = Router();

import validate from "../../middlewares/validate.js";
import { registerSchema } from "./client.schemas.js";

import { registerClient } from "./client.controller.js";

router.post("/", validate(registerSchema), registerClient);

export default router;
