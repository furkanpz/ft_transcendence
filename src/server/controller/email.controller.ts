import {FastifyReply, FastifyRequest} from 'fastify';
import { db_User, friendstat, userRole, jwtUser } from '../types/user.types'
import {getUser2FAStatus, setTemp2FA, get2FAOTP, setUser2FA} from '../services/user/user.services'
import { generateOTP, verifyOTP, send2FA } from '../services/mail/email.services';

export async function set2FAController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const body = request.body  as {email: string, t2type: boolean}
	const db_twoFactorStatus = await getUser2FAStatus(user.id);
	if (db_twoFactorStatus == body.t2type)
		return (response.code(400).send({success: true, message: `Already ${db_twoFactorStatus}`}));
	if (body.t2type == true)
	{
		const OTP = generateOTP();
		await setTemp2FA(user.id, OTP.otp, OTP.secret);
		await send2FA(body.email, OTP.otp);
		return (response.code(200).send({success: true, message: "OTP Code Sended!"}));
	}
	else
	{
		// AYARLANCAK
	}

}

export async function veriyfandSetOTPController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const body = request.body as {OTP: string, t2type: boolean};
	
	const db_OTP = await get2FAOTP(user.id);
	if (!db_OTP)
		return (response.code(400).send({success: false, message: "OTP Invalid!"}));
	const otpstatus = verifyOTP(body.OTP, db_OTP.twof_secret);
	if (otpstatus)
	{
		await setUser2FA(user.id, body.t2type);
		if (body.t2type)
			return (response.code(200).send({success: true, message: "2FA Enabled"}));
		else
			return (response.code(200).send({success: true, message: "2FA Disabled"}));
	}
	else
		return (response.code(401).send({success: false, message: "OTP Invalid!"}));
}

export async function veriyfOTPController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const body = request.body as {OTP: string};
	const db_OTP = await get2FAOTP(user.id);
	if (!db_OTP)
		return (response.code(400).send({success: false, message: "OTP Invalid!"}));
	const otpstatus = verifyOTP(body.OTP, db_OTP.twof_secret);

	if (otpstatus)
	{
		if (body.t2type)
			return (response.code(200).send({success: true, message: "2FA Enabled"}));
		else
			return (response.code(200).send({success: true, message: "2FA Disabled"}));
	}
	else
		return (response.code(401).send({success: false, message: "OTP Invalid!"}));
}