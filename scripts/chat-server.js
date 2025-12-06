import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

const PORT = process.env.FRWC_CHAT_PORT ? Number(process.env.FRWC_CHAT_PORT) : 4317;

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('FRW Chat Relay is running');
});

const wss = new WebSocketServer({ server });

const rooms = new Map();

function getRoom(name) {
  if (!rooms.has(name)) {
    rooms.set(name, new Set());
  }
  return rooms.get(name);
}

function broadcast(roomName, payload, except) {
  const room = rooms.get(roomName);
  if (!room) return;

  for (const client of room) {
    if (client.readyState === WebSocket.OPEN && client !== except) {
      client.send(JSON.stringify(payload));
    }
  }
}

wss.on('connection', (socket) => {
  const id = randomUUID();
  let joinedRoom = null;

  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.type === 'join') {
        if (joinedRoom) {
          const currentRoom = rooms.get(joinedRoom);
          currentRoom?.delete(socket);
        }
        joinedRoom = message.room || 'global';
        const room = getRoom(joinedRoom);
        room.add(socket);
        socket.send(JSON.stringify({ type: 'joined', room: joinedRoom, id }));
      }

      if (message.type === 'chat' && joinedRoom) {
        broadcast(joinedRoom, {
          type: 'chat',
          id,
          alias: message.alias || 'anon',
          text: message.text,
          timestamp: Date.now()
        }, socket);
      }
    } catch (error) {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid payload' }));
    }
  });

  socket.on('close', () => {
    if (!joinedRoom) return;
    const room = rooms.get(joinedRoom);
    room?.delete(socket);
  });
});

server.listen(PORT, () => {
  console.log(`[FRW Chat Relay] listening on http://localhost:${PORT}`);
});
