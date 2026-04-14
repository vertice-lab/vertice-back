import crypto from 'crypto';
export const generateRandomCode = (
  length: number = 16,
  prefix: string = 'CASH-',
): string => {
  const randomBytes = crypto.randomBytes(length);

  const random = randomBytes.toString('hex').substring(0, length);

  const timestamp = Date.now().toString(36);

  return `${prefix}${random}${timestamp}`;
};

export const generateOTP = (length: number = 6): string => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};
