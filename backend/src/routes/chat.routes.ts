import { Router } from 'express';
import {
  getRooms,
  getMessages,
  createRoom,
} from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth';
import { requireVerified } from '../middlewares/requireVerified';

const router = Router();

router.use(authenticate, requireVerified);

router.get('/rooms', getRooms);
router.get('/rooms/:roomId/messages', getMessages);
router.post('/rooms', createRoom);

export default router;
