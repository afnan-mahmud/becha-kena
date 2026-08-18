import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth';
import { requireVerified } from '../middlewares/requireVerified';
import { validate } from '../middlewares/validate';
import { submitReportSchema } from '../validations/report.validation';

const router = Router();

router.post('/', authenticate, requireVerified, validate(submitReportSchema), reportController.submitReport);
router.get('/my', authenticate, reportController.getMyReports);

export default router;
