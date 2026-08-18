import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/verify-adult', verificationController.submitAdultVerification);
router.post('/verify-minor', verificationController.submitMinorVerification);
router.get('/status', verificationController.getVerificationStatus);

export default router;
