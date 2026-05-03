import { Router } from "express";
const router = Router();

import validate from "../../middlewares/validate.js";
import { getSchema, createSchema } from "./authorize.schemas.js";

import {
    getAuthorizationCode,
    createAuthorizationCode,
} from "./authorize.controller.js";

router.get("/", validate(getSchema), getAuthorizationCode);
router.post("/", validate(createSchema), createAuthorizationCode);

export default router;
