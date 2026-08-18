import { AppError } from './AppError';

export const normalizePhone = (input: string): string => {
  // Remove any spaces or hyphens that might have been entered
  const cleaned = input.replace(/[\s-]/g, '');
  
  // Validate against flexible format
  const regex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
  const match = cleaned.match(regex);
  
  if (!match) {
    throw new AppError('Invalid Bangladeshi phone number format', 400, 'INVALID_PHONE');
  }
  
  // Return canonical format +8801XXXXXXXXX
  return `+88${match[1]}`;
};
