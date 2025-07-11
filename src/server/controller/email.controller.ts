import {FastifyReply, FastifyRequest} from 'fastify';
import { db_User, friendstat, userRole, jwtUser } from '../types/user.types'
import {getUser2FAStatus, setTemp2FA, get2FAOTP, setUser2FA} from '../services/user/user.services'
import { generateOTP, verifyOTP, send2FA } from '../services/mail/email.services';
import * as userServices from '../services/user/user.services'
import { createJWT } from '../services/auth/jwt.services';


export async function set2FAController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const body = request.body  as {t2type: boolean}
	const db_user = await userServices.userIdFindInDb(user.id) as db_User;
	const db_twoFactorStatus = await getUser2FAStatus(user.id);

	if (db_twoFactorStatus == body.t2type)
		return (response.code(400).send({success: true, message: `Already ${db_twoFactorStatus}`}));
	const OTP = generateOTP();
	await setTemp2FA(user.id, OTP.otp, OTP.secret);
	await send2FA(db_user.email, OTP.otp);
	return (response.code(200).send({success: true, message: "OTPSENDED"})); // veriyfandSetOTPController

}

export async function veriyfandSetOTPController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const body = request.body as {OTP: string};
	const db_OTP = await get2FAOTP(user.id);
	const is_verified = await userServices.getTemp2FAVerified(user.id);
	if (!db_OTP || is_verified)
		return (response.code(400).send({success: false, message: "OTP Invalid!"}));
	const otpstatus = verifyOTP(body.OTP, db_OTP.twof_secret);
	if (otpstatus)
	{
		await userServices.updateTemp2FAVerified(user.id, true);
		const db_twoFactorStatus = await getUser2FAStatus(user.id);
		console.log(db_twoFactorStatus);
		const newStatus = db_twoFactorStatus === false ? true : false;
		await setUser2FA(user.id, newStatus);
		if (newStatus)
			return (response.code(200).send({success: true, message: "2FA Enabled"}));
		else
			return (response.code(200).send({success: true, message: "2FA Disabled"}));
	}
	else
		return (response.code(401).send({success: false, message: "OTP Invalid!"}));
}

export async function veriyfOTPController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.body as {username: string, OTP: string};
	const db_user = await userServices.userFindInDb(user.username) as db_User;
	if (!db_user)
		return (response.code(401).send({success: false, message: "Invalid Username"}));
	const db_OTP = await get2FAOTP(db_user.id);
	const is_verified = await userServices.getTemp2FAVerified(db_user.id);
	if (!db_OTP || is_verified)
		return (response.code(400).send({success: false, message: "OTP Invalid!"}));
	const otpstatus = verifyOTP(user.OTP, db_OTP.twof_secret);
	if (otpstatus)
	{	
		await userServices.updateTemp2FAVerified(db_user.id, true);
		const token = await createJWT(db_user);
		if (!token)
			return response.code(500).send({success:false,  message: 'Failed to generate token' });
		response.setCookie('access_token', token, {
				httpOnly: true,
				path: '/',
				sameSite: 'strict',
				// secure: true only https durumu
			});
		userServices.setIsOnline(true, db_user.id);
		return (response.code(200).send({success: true, access_token: token}));
	}
	else
		return (response.code(401).send({success: false, message: "OTP Invalid!"}));
}