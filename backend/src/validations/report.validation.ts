import { ValidationSchema } from '../middlewares/validate';

export const submitReportSchema: ValidationSchema = {
  body: {
    targetType: { required: true, type: 'string', enum: ['Listing', 'User'] },
    targetId: { required: true, type: 'string' },
    reason: { required: true, type: 'string', enum: ['spam', 'fraud', 'inappropriate', 'other'] },
    description: { required: true, type: 'string', maxLength: 1000 }
  }
};
