import { Router } from "express";
import { signQzRequest } from "./controllers.ts";

const router = Router();

// GET /sign?request=xxxx
router.get("/sign", signQzRequest);

export default router;
