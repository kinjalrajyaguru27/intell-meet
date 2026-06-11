import { Router, type IRouter } from "express";
import healthRouter from "./health";
import roomsRouter from "./rooms";
import meetingsRouter from "./meetings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(roomsRouter);
router.use(meetingsRouter);

export default router;
