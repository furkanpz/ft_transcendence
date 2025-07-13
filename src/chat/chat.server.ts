import Fastify from 'fastify';
import websocket from '@fastify/websocket';


const chatServer = Fastify();
chatServer.register(websocket);

chatServer.listen({ port: 4000, host: '0.0.0.0' }, () => {
	console.log('Live Chat: ws://localhost:4000');
});