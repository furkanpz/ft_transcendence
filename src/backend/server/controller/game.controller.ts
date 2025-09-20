import { gameManager } from '../services/chat/game.manager';
import server from '../server';

export async function gameController(connection: any, req: any) {
	try {
		const token = req.cookies.access_token;
		if (!token) {
		  connection.close(1008, 'Authentication required');
		  return;
		}

		const jwtusr = server.jwt.verify(token) as any;
		gameManager.addPlayer(jwtusr.id, jwtusr.username, connection);
		
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to chat server' }
		}));
	  } catch (error) {
		console.log(error); // debug
		connection.close(1008, 'Invalid token');
	  }
}