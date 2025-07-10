import nodemailer from 'nodemailer'
import * as speakeasy from 'speakeasy'
const smtp = nodemailer.createTransport( {
	host: "smtp-relay.brevo.com",
    port: 587,
	secure: false,
	auth: {
		user: "91c332001@smtp-brevo.com",
		pass: "ZX2bBIRYcjKhTG6V"
	}
});

export async function send2FA(email: string, otp: number){
    await smtp.sendMail({
        from: '"ft_transcendance" <furkanvibe@gmail.com>',
        to: email,
        subject: 'FT_TRANSCENDENCE 2FA Validation',
        html: `
      <h2>Your 2FA Code</h2>
      <p style="font-size: 20px;"><strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `,
    })
}

export function generateOTP() {
  const secret = speakeasy.generateSecret();
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    step: 300,
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
