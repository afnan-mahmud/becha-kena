import { ValidationSchema } from '../middlewares/validate';

export const createListingSchema: ValidationSchema = {
  body: {
    title: { required: true, type: 'string', minLength: 10, maxLength: 80 },
    description: { required: true, type: 'string', minLength: 20, maxLength: 1000 },
    price: { required: true, type: 'number', min: 0 },
    category: { required: true, type: 'string' },
    condition: { required: true, type: 'string', enum: ['new', 'like_new', 'used'] },
    images: {
      required: true,
      type: 'array',
      custom: (val) => Array.isArray(val) && val.length > 0 && val.length <= 10 ? true : 'images must contain 1 to 10 image URLs'
    },
    'location.coordinates': {
      required: true,
      type: 'array',
      custom: (val) => Array.isArray(val) && val.length === 2 && typeof val[0] === 'number' && typeof val[1] === 'number'
        ? true : 'location.coordinates must be an array of exactly 2 numbers'
    }
  }
};
