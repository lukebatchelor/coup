import express from 'express';
import { wrapExpressPromise } from './util';
import { getRoom } from './repository';

export const routes = express.Router();

routes.get(
  '/api/rooms/:roomCode',
  wrapExpressPromise<GetRoomRequest, GetRoomResponse>(async (req, _res) => {
    const room = await getRoom(req.params.roomCode);
    if (!room) {
      return { room: null };
    }
    return { room: { roomCode: req.params.roomCode } };
  })
);

routes.get('/test', (req, res) => res.sendFile('index.html', { root: __dirname }));

routes.get('/api/heartbeat', (req, res) => {
  res.send('ba-bum');
});
