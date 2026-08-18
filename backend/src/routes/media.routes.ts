import { Router } from 'express';
import { getPresignedUrl } from '../controllers/media.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/presigned-url', authenticate, getPresignedUrl);

export default router;
