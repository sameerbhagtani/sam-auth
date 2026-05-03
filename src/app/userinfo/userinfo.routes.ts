import { Router } from "express";
const router = Router();

import { getUserInfo } from "./userinfo.controller.js";

router.get("/userinfo", getUserInfo);

export default router;
