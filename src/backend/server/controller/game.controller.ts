import { gameManager } from '../services/chat/game.manager';
import server from '../server';

export async function gameController(connection: any, req: any) {
		console.log("New WebSocket connection to /ws/game");
	try {
		gameManager.addPlayer(1, "test", connection);
		
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to game server' }
		}));
	  } catch (error) {
		console.log(error); // debug
		connection.close(1008, 'Invalid token');
	  }
}