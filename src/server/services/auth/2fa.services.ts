import * as speakeasy from 'speakeasy'

export function generateOTP() {
  const secret = speakeasy.generateSecret();
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    step: 300,
  });

  return { otp: token, secret: secret.base32 };
}

export function generateOTP_2() {
  const secret = speakeasy.generateSecret();
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    step: 300,
    digits: 12,
  });

  return { otp: token, secret: secret.base32 };
}

export function verifyOTP(token: string, secret: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    step: 300,
    window: 1,
  });
}

export function verifyOTP_2(token: string, secret: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    step: 300,
    window: 1,
    digits:12
  });
}
