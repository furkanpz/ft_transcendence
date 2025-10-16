import nodemailer from 'nodemailer'
import { MAIN_URL } from '../../server'

const smtp = nodemailer.createTransport( {
	host: "smtp-relay.brevo.com",
    port: 587,
	secure: false,
	auth: {
		user: "91c332001@smtp-brevo.com",
		pass: "ZX2bBIRYcjKhTG6V"
	}
});

export default async function send2FA(email: string, otp: string){
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


export async function sendRecovery(email: string, otp: string){
    await smtp.sendMail({
        from: '"ft_transcendance" <furkanvibe@gmail.com>',
        to: email,
        subject: 'FT_TRANSCENDENCE Recovery Account',
        html: `
      <h2>Your 2FA Code</h2>
      <p style="font-size: 20px;"><strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `,
    })
}
// ENV DOMAIN GEREKLİ!
export async function sendRecovery_2(email: string, otp: string){
	// Send user to FRONTEND page, not backend API; frontend will call backend with these params
	const base = MAIN_URL.replace(/\/+$/, '');
	const recoveryUrl = `${base}/forgot-password?verify=${otp}&email=${encodeURIComponent(email)}`;

	await smtp.sendMail({
		from: '"ft_transcendance" <furkanvibe@gmail.com>',
		to: email,
		subject: 'FT_TRANSCENDENCE Recovery Account',
		html: `
			<h2>Your 2FA Code</h2>
			<p style="font-size: 20px;"><strong>${otp}</strong></p>
			<p>This URL will expire in 5 minutes.</p>
			<p>
				<a href="${recoveryUrl}" style="font-size: 16px;">Click here to recover your account</a>
			</p>
			<p>If the link doesn't work, copy and paste this into your browser:</p>
			<p>${recoveryUrl}</p>
		`,
	});
}
