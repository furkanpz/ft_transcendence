import {FastifyReply} from 'fastify';

export function sendSuccess(response: FastifyReply, message: string, extraData = {}) {
	return response.code(200).send({ success: true, message, ...extraData });
}

export function sendError(response: FastifyReply, code: number, message: string) {
	return response.code(code).send({ success: false, message });
}