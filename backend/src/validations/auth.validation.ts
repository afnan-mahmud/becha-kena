import { ValidationSchema } from '../middlewares/validate';

export const requestOtpSchema: ValidationSchema = {
  body: {
    phoneNumber: { required: true, type: 'string' }
  }
};

export const verifyOtpSchema: ValidationSchema = {
  body: {
    phoneNumber: { required: true, type: 'string' },
    otpCode: { required: true, type: 'string', minLength: 6, maxLength: 6 }
  }
};
