import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export type ValidationRule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: any[];
  pattern?: RegExp;
  custom?: (value: any) => boolean | string; // return true if valid, or error message string if invalid
};

export type ValidationSchema = {
  body?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
};

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const validateField = (value: any, rule: ValidationRule, fieldPath: string): string | null => {
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${fieldPath} is required`;
  }

  if (value === undefined || value === null || value === '') return null; // skip other validations if empty and not required

  if (rule.type) {
    if (rule.type === 'array' && !Array.isArray(value)) {
      return `${fieldPath} must be an array`;
    }
    if (rule.type !== 'array' && typeof value !== rule.type) {
      return `${fieldPath} must be a ${rule.type}`;
    }
  }

  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return `${fieldPath} must be at least ${rule.minLength} characters`;
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return `${fieldPath} must be at most ${rule.maxLength} characters`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldPath} is invalid`;
    }
  }

  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `${fieldPath} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return `${fieldPath} must be at most ${rule.max}`;
    }
  }

  if (rule.enum && !rule.enum.includes(value)) {
    return `${fieldPath} must be one of: ${rule.enum.join(', ')}`;
  }

  if (rule.custom) {
    const customResult = rule.custom(value);
    if (typeof customResult === 'string') {
      return customResult;
    }
    if (customResult === false) {
      return `${fieldPath} is invalid`;
    }
  }

  return null;
};

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const details: string[] = [];

    ['body', 'query', 'params'].forEach((target) => {
      const targetSchema = schema[target as keyof ValidationSchema];
      if (targetSchema) {
        const reqData = req[target as keyof Request] || {};
        
        for (const [field, rule] of Object.entries(targetSchema)) {
          const value = getNestedValue(reqData, field);
          const error = validateField(value, rule, field);
          if (error) {
            details.push(error);
          }
        }
      }
    });

    if (details.length > 0) {
      const err = new AppError('Validation failed', 400, 'VALIDATION_FAILED');
      err.details = details;
      return next(err);
    }

    next();
  };
};
