import { ValidationSchema } from '../middlewares/validate';

export const submitReviewSchema: ValidationSchema = {
  body: {
    listingId: { required: true, type: 'string' },
    rating: { 
      required: true, 
      type: 'number',
      min: 1,
      max: 5,
      custom: (val) => Number.isInteger(val) ? true : 'rating must be an integer'
    },
    reviewText: { required: true, type: 'string', maxLength: 500 }
  }
};
