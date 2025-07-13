import nodemailer from 'nodemailer'

const smtp = nodemailer.createTransport( {
	host: "smtp-relay.brevo.com",
    port: 587,
	secure: false,
	auth: {
		user: "91c332001@smtp-brevo.com",
		pass: "ZX2bBIRYcjKhTG6V"
	}
});

export default async function send2FA(email: string, otp: number){
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

