import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import verificationRoutes from './routes/verification.routes';
import mediaRoutes from './routes/media.routes';
import adRoutes from './routes/ad.routes';
import chatRoutes from './routes/chat.routes';
import reviewRoutes from './routes/review.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Becha-Kena API is running',
    timestamp: Date.now(),
    version: '1.0.0'
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/kyc', verificationRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/listings', adRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;