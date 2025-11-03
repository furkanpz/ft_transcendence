import { db_User, User, friendstat, userRole, jwtUser } from '../types/user.types'

export const usernameKeySchema = { 
	type:					'string',
	minLength:				3,
	maxLength:				36,
	pattern:				'^[a-zA-Z0-9_]+$'
}

export const passwordKeySchema = { 
		type:		'string',
		minLength:	6,
		maxLength:	64,
	}
export const emailKeySchema = { type: 'string',
			format:				"email",
			maxLength:		320,
			minLength:		4,
			}
export const twoFSchema = {
	body : {
		required:			['t2type'],
		type: 'object',
		properties: {
			t2type: { type: 'boolean' }
	}
}};

export const imageDataUriSchema = {
	type: 'string',
	pattern: '^data:image\\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$',
	maxLength: 10000000,
}

export const imageSchema = {
		body: {
			type: 'object',
			required: ['image'],
			properties: {
				image: imageDataUriSchema
			}
		}
	};


export const twoFSVerifySchema = {
	body : {
		required:			['OTP'],
		type: 'object',
		properties: {
			OTP: { type: 'number' }
	}
}};

export const loginSchema = {
	body: {
		required:			['username', 'password'],
		type: 'object',
		properties: {
			username:		usernameKeySchema,
			password:		passwordKeySchema
		},
		additionalProperties: false
	},
};

export const twoFloginSchema = {
	body: {
		required:			['username', 'OTP'],
		type: 'object',
		properties: {
			username:		usernameKeySchema,
			OTP: {type :'number'}
		},
		additionalProperties: false
	},
};

export const registerSchema = {
	body: {
		required:			['email', 'username', 'password'],
		type: 'object',
		properties: {
			email:			emailKeySchema,
			username:		usernameKeySchema,
			password:		passwordKeySchema
		},
		additionalProperties: false
	},
};

export const friendRequestSchema = {
	body: {
		required: 			['username', "request_type"],
		type: 'object',
		properties: {
			username:		{type: 'string'},
			user_id:		{type: 'number'},
			request_type:	{type: 'string',  enum:	[friendstat.Accepted, friendstat.Pending, friendstat.Remove]},
		},
		additionalProperties: false
	},
};

export const passwordSchema = {
	body:{
		required: 			['password', 'new_password', 'new_re_password'],
		type: 'object',
		properties: {
			user_id:		{type: 'number'},
			password:		passwordKeySchema,
			new_password:	passwordKeySchema,
			new_re_password:passwordKeySchema
		},
		additionalProperties: false
	},
}
export const usernameSchema = {
	body:{
		required: 			['username'],
		type: 'object',
		properties: {
			username:		usernameKeySchema,
		},
		additionalProperties: false
	},
}


export const roleSchema = {
	body: {
		required:			['newRole', 'user_id'],
		type: 'object',
		properties:{
			newRole: 		{type: 'string',
				enum:		[userRole.admin, userRole.user]},
			user_id:		{type: 'number'}
			},
		additionalProperties: false
	}
}

export const friendDetailsSchema = {
	body: {
		type: 'object',
		required: ['friends'],
		properties: {
			friends: {
				type: 'array',
				items: { type: 'number' },
				minItems: 1
			}
		},
		additionalProperties: false
	}
};

export const blockUserSchema = {
	body: {
		required: ['blocked_id'],
		type: 'object',
		properties: {
			blocked_id: { type: 'number' },
			user_id: { type: 'number' } 
		},
		additionalProperties: false
	}
};

export const unblockUserSchema = {
	params: {
		type: 'object',
		properties: {
			unBlockId: { type: 'string' }
		}
	},
	querystring: {
		type: 'object',
		properties: {
			user_id: { type: 'string' }
		}
	}
};


export const roomsSchema = {
	body: {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', minLength: 1, maxLength: 100 },
			isPrivate: { type: 'boolean' }
		}
	}
};

export const joinRoomSchema = {
	params: {
		type: 'object',
		properties: {
			roomId: { type: 'string' }
		}
	}
};

export const roomHistorySchema = {
	params: {
		type: 'object',
		properties: {
			roomId: { type: 'string' }
		}
	},
	querystring: {
		type: 'object',
		properties: {
			limit: { type: 'string' }
		}
	}
};

export const deleteRoomSchema = {
	params: {
		type: 'object',
		properties: {
			roomId: { type: 'string' }
		}
	}
};

export const account_recovery = {
	body: {
		required: ['email'],
		type: 'object',
		properties: {
			email: emailKeySchema,
		}
	}
}

export const recoveryPageSchema = {
	querystring: {
		required: ["verify", "email"],
		type: 'object',
		properties: {
			email: emailKeySchema,
			verify: { type: 'string' },
		}
	}
}

export const recoveryStepTwoPageSchema = {
	body: {
		type: 'object',
		required: ['email', 'verifycode', 'new_password', 'new_re_password'],
		properties: {
			email: emailKeySchema,
			verifycode: {type: 'string'},
			new_password:	passwordKeySchema,
			new_re_password:passwordKeySchema
		}
	}
}

export const gameRoomSchema = {
	body: {
		type: 'object',
		properties: {
			
		}
	}
}