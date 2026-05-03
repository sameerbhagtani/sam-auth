import { Router } from "express";
const router = Router();

import { getOpenIdConfiguration, getJWKSJson } from "./discovery.controller.js";

router.get("/openid-configuration", getOpenIdConfiguration);
router.get("/jwks.json", getJWKSJson);

export default router;
