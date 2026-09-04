import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentLinkRouter from "./payment-link";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paymentLinkRouter);

export default router;
