import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Private routes
router.get('/me', authenticate, userController.getMe);
router.put('/me', authenticate, userController.updateMe);
router.delete('/me', authenticate, userController.deleteMe);

// Public routes
router.get('/:id', userController.getPublicProfile);

export default router;
