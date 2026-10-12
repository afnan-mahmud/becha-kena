import { ValidationSchema } from '../middlewares/validate';

export const submitReportSchema: ValidationSchema = {
  body: {
    targetType: { required: true, type: 'string', enum: ['Listing', 'User'] },
    targetId: { required: true, type: 'string' },
    reason: { required: true, type: 'string', enum: ['scam', 'harassment', 'misrepresentation', 'inappropriate', 'other'] },
    description: { required: true, type: 'string', minLength: 1, maxLength: 1000 }
  }
};
