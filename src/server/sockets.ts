import socketIo from 'socket.io';
import { v4 as uuid } from 'uuid';
import randomstring from 'randomstring';
import http from 'http';

import {
  addUser,
  getUser,
  createRoom,
  getRoom,
  addUserToRoom,
  getUsersInRoom,
  removeRoomFromUser,
  startGameForRoom,
  setGameStateForRoom,
  UserRecord,
  HostMode,
} from './repository';

export function configureSockets(appServer: http.Server) {
  const server = socketIo(appServer);

  server.on('connection', (client: socketIo.Socket & { playerId: string }) => {
    client.on('handshake', handshake);
    client.on('disconnect', disconnect);
    client.on('create-room', createNewRoom);
    client.on('player-join-room', playerJoinsRoom);
    client.on('player-leave-room', playerLeavesRoom);
    client.on('all-players-ready', allPlayersReady);
    // client.on('player-loaded-game', playerLoadedGame);
    // client.on('player-move', playerMove);
    // client.on('next-game-over-step', nextGameOverStep);
    // client.on('restart-game', restartGame);
    // client.on('request-game-state', requestGameState);

    async function handshake({ id }: HandshakeMessage) {
      let exists: UserRecord = null;
      let inGame = false;
      if (id) {
        exists = await getUser(id);
      }
      if (!exists) {
        id = uuid();
        await addUser(id);
        console.log(`New client, assigning id [${id}]`);
      } else {
        console.log(`Player ${id} reconnected with nickname ${exists.nickName} and room ${exists.roomCode}.`);
        if (exists.roomCode) {
          inGame = (await getRoom(exists.roomCode)).inGame;
          console.log(`${id} in game? : ${JSON.stringify(inGame)}`);
        }
      }
      client.playerId = id;
      client.emit('welcome', {
        id,
        nickName: exists ? exists.nickName : '',
        roomCode: exists ? exists.roomCode : '',
        host: exists ? !!exists.host : null,
        inGame: !!inGame,
      } as WelcomeMessage);
      if (exists && exists.nickName && exists.roomCode) {
        await playerJoinsRoom({ roomCode: exists.roomCode, nickName: exists.nickName, host: exists.host });
      }
    }

    function disconnect() {
      console.log(`Player [${client.playerId}] disconnected`);
    }

    async function createNewRoom() {
      const roomCode = randomstring.generate({ length: 5, charset: 'alphabetic' }).toUpperCase();
      await createRoom(roomCode);
      console.log(`Created a new room ${roomCode}`);
      client.emit('room-created', { roomCode });
    }

    async function playerJoinsRoom({ roomCode, nickName, host }: PlayerJoinRoomMessage) {
      await addUserToRoom(roomCode, client.playerId, nickName, host);
      const usersInRoom = await getUsersInRoom(roomCode);
      client.join(roomCode);
      console.log('sending room status ', JSON.stringify({ roomCode, players: usersInRoom }));
      server.to(roomCode).emit('room-status', { roomCode, players: usersInRoom } as RoomStatusMessage);
      console.log(`Player ${client.playerId} joined room ${roomCode}`);
    }

    async function playerLeavesRoom({ roomCode }: PlayerLeaveRoomMessage) {
      const user = await getUser(client.playerId);
      const wasHost = user.host;

      await removeRoomFromUser(client.playerId);
      const usersInRoom = await getUsersInRoom(roomCode);
      client.leave(roomCode);
      console.log('sending room status ', JSON.stringify({ roomCode, players: usersInRoom }));
      server.to(roomCode).emit('room-status', { roomCode, players: usersInRoom });
      if (wasHost) {
        server.to(roomCode).emit('host-disconnected');
      }
      console.log(`Player ${client.playerId} left room ${roomCode} (host: ${wasHost})`);
    }

    async function allPlayersReady({ roomCode }: AllPlayersReadyMessage) {
      const usersInRoom = (await getUsersInRoom(roomCode)).filter((p) => p.host === false);
      // const startups = new Startups({ players: shuffle(usersInRoom) });
      await startGameForRoom(roomCode, 'state');
      console.log(`Starting game in room ${roomCode}`);
      server.to(roomCode).emit('start-game');
    }

    function shuffle(array: Array<any>) {
      let counter = array.length;
      while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        counter--;
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
      }

      return array;
    }
  });
}
