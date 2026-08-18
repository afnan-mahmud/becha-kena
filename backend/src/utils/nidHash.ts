import crypto from 'crypto';

export const hashNID = (nidNumber: string): string => {
  const salt = process.env.NID_HASH_SALT || '';
  const pepper = process.env.NID_HASH_PEPPER || '';
  
  const data = nidNumber + salt + pepper;
  
  return crypto.createHash('sha256').update(data).digest('hex');
};
