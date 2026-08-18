import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

// All admin routes require authentication and at least moderator role
router.use(authenticate);
router.use(authorize('admin', 'moderator'));

// Moderation
router.get('/moderation/listings', adminController.getModerationQueue);
router.patch('/moderation/listings/:id', adminController.moderateListing);

// KYC Review
router.get('/kyc/queue', adminController.getManualVerificationQueue);
router.patch('/kyc/:logId', adminController.resolveVerification);
router.post('/kyc/nid-preview', adminController.getPresignedNidUrl);

// Reports
router.get('/reports', adminController.getReports);
router.patch('/reports/:id/resolve', adminController.resolveReport);
router.patch('/reports/:id/dismiss', adminController.dismissReport);

// User Ban (admin only)
// This adds an additional layer of authorization, strictly requiring 'admin' role
router.post('/users/:id/ban', authorize('admin'), adminController.banUser);

export default router;
