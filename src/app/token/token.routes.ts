import { Router } from "express";
const router = Router();

import validate from "../../middlewares/validate.js";
import { tokenSchema } from "./token.schemas.js";
import { exchangeToken } from "./token.controller.js";

router.post("/token", validate(tokenSchema), exchangeToken);

export default router;
