import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sofascoreRouter from "./sofascore";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sofascoreRouter);

export default router;
