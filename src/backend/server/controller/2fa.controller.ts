import { FastifyReply, FastifyRequest } from 'fastify';
import { db_User, jwtUser } from '../types/user.types';
import {
	getUser2FAStatus, setTemp2FA,
	get2FAOTP, setUser2FA, getUserWithEmail
} from '../services/user/user.services';
import send2FA from '../services/mail/email.services';
import * as userServices from '../services/user/user.services';
import { generateOTP, verifyOTP, verifyOTP_2 } from '../services/auth/2fa.services';
import { sendSuccess, sendError } from '../helpers/response';
import { createJWT } from '../services/auth/jwt.services';
export async function set2FAController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const body = request.body as { t2type: boolean };
	const db_user = await userServices.userIdFindInDb(user.id) as db_User;
	const db_twoFactorStatus = await getUser2FAStatus(user.id);

	if (db_twoFactorStatus == body.t2type)
		return sendError(response, 400, `Already ${db_twoFactorStatus}`);
	const OTP = generateOTP();
	await setTemp2FA(user.id, OTP.otp, OTP.secret);
	await send2FA(db_user.email, OTP.otp);
	return sendSuccess(response, "OTP sent successfully");
}

export async function veriyfandSetOTPController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const body = request.body as { OTP: string };
	const db_OTP = await get2FAOTP(user.id);
	if (!db_OTP)
		return sendError(response, 400, "OTP Invalid!");
	const otpstatus = verifyOTP(body.OTP, db_OTP.twof_secret);
	if (otpstatus) {
		await userServices.updateTemp2FAVerified(user.id, true);
		const db_twoFactorStatus = await getUser2FAStatus(user.id);
		const newStatus = db_twoFactorStatus === false ? true : false;
		await setUser2FA(user.id, newStatus);
		if (newStatus)
			return sendSuccess(response, "2FA Enabled");
		else
			return sendSuccess(response, "2FA Disabled");
	} else {
		// OTP yanlış ise 400 döndür (kimlik doğrulama eksikliği ile karışmasın)
		return sendError(response, 400, "OTP Invalid!");
	}
}

export async function veriyfOTPController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.body as { username: string, OTP: string };
	const db_user = await userServices.userFindInDb(user.username) as db_User;
	if (!db_user)
		return sendError(response, 401, "Invalid Username");
	const db_OTP = await get2FAOTP(db_user.id);
	if (!db_OTP)
		return sendError(response, 400, "OTP Invalid!");
	const otpstatus = verifyOTP(user.OTP, db_OTP.twof_secret);
	if (otpstatus) {
		await userServices.updateTemp2FAVerified(db_user.id, true);
		const token = await createJWT(db_user);
		if (!token)
			return sendError(response, 500, "Failed to generate token");
		response.setCookie('access_token', token, {
			httpOnly: true,
			path: '/',
			sameSite: 'strict',
			secure: true
		});
		userServices.setIsOnline(true, db_user.id);
		return sendSuccess(response, "Token generated successfully", { access_token: token });
	} else 
		return sendError(response, 401, "OTP Invalid!");
}

export async function veriyfMailOTPController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const {verifycode, email,
		new_password, new_re_password
	} = request.body as 
	{
		verifycode: string, email: string, 
		new_password: string, new_re_password: string
	};
	if (new_password !== new_re_password)
		return sendError(response, 400, "Passwords do not match!");
	const id = await getUserWithEmail(email) as number | undefined;
	console.log("İD BU : ", id);
	if (!id)
		return (sendError(response, 401, "Expired Recovery!"));
	if (!(await userServices.getLatestValidVerifiedOTPByUser(id, verifycode)))
		return (sendError(response, 401, "Expired Recovery!"));

	await userServices.setNewPw(new_password, id);
	return sendSuccess(response, "Password changed successfully");
}

export async function mailAccountRecoveryController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply>
{
	const {verify, email} = request.query as {verify: string, email: string};
	const id = await getUserWithEmail(email) as number | undefined;
	if (!id)
		return (sendError(response, 401, "Incorrect Recovery Link"));
	const db_OTP = await get2FAOTP(id);
	if (!db_OTP)
		return (sendError(response, 401, "Incorrect Recovery Link"));
	const otpstatus = verifyOTP_2(verify, db_OTP.twof_secret);
	if (otpstatus) {
		await userServices.setTemp2FAForRecovery(id, db_OTP.twof_code);
		return sendSuccess(response, "STEPTWOAUTHREQ", {
			email: email,
			verifycode: verify
		});
	}
	return sendError(response, 401, "Incorrect Recovery Link");
}