import socketIo from 'socket.io';
import { v4 as uuid } from 'uuid';
import randomstring from 'randomstring';
import http from 'http';
import Coup from './coup';
import isEqual from 'lodash.isequal';
import { assert } from 'console';

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
    function safeEmit<Event extends keyof SocketEvents>(event: Event, payload?: SocketEvents[Event]) {
      client.emit(event, payload);
    }
    function safeOn<Event extends keyof SocketEvents>(event: Event, callback: (payload?: SocketEvents[Event]) => void) {
      client.on(event, callback);
    }
    function safeRoomEmit<Event extends keyof SocketEvents>(
      roomCode: string,
      event: Event,
      payload?: SocketEvents[Event]
    ) {
      server.to(roomCode).emit(event, payload);
    }

    safeOn('handshake', handshake);
    safeOn('disconnect', disconnect);
    safeOn('create-room', createNewRoom);
    safeOn('player-join-room', playerJoinsRoom);
    safeOn('player-leave-room', playerLeavesRoom);
    safeOn('all-players-ready', allPlayersReady);
    safeOn('player-loaded-game', playerLoadedGame);
    safeOn('player-action', playerAction);
    safeOn('resolve-action', resolveAction);
    // safeOn('next-game-over-step', nextGameOverStep);
    safeOn('restart-game', restartGame);
    // safeOn('request-game-state', requestGameState);

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
      safeEmit('welcome', {
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
      const roomCode = randomstring.generate({ length: 4, charset: 'alphabetic' }).toUpperCase();
      await createRoom(roomCode);
      console.log(`Created a new room ${roomCode}`);
      safeEmit('room-created', { roomCode });
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
      const usersInRoom = (await getUsersInRoom(roomCode)).filter((p) => p.host == false);
      const players = usersInRoom.map((p) => ({ id: p.id, nickname: p.nickName }));
      console.log('Starting new game', { usersInRoom, players });
      const coup = new Coup(shuffle(players));
      await startGameForRoom(roomCode, coup.dumpJson());
      console.log(`Starting game in room ${roomCode}`);
      server.to(roomCode).emit('start-game');
    }

    async function playerLoadedGame() {
      const user = await getUser(client.playerId);
      const usersInRoom = await getUsersInRoom(user.roomCode);
      const hostId = usersInRoom.filter((p) => p.host)[0].id;
      const room = await getRoom(user.roomCode);
      // Only send once to each client
      console.log('Sending game-state to' + JSON.stringify({ user, roomCode: user.roomCode }));
      const coup = new Coup([]);
      coup.loadJson(room.gameState);

      const { actionStack, actions, players, hands, currTurn, actionList, waitingOnPlayers }: GameState = coup.state;
      const gameState = { actionStack, actions, players, currTurn, hands, actionList, waitingOnPlayers };
      safeEmit('game-state', { roomCode: user.roomCode, players: usersInRoom, gameState, hostId });
    }

    async function playerAction({ action }: PlayerActionMessage) {
      console.log(`${client.playerId} trying to do action ${JSON.stringify(action)}`);
      const user = await getUser(client.playerId);
      const usersInRoom = await getUsersInRoom(user.roomCode);
      const hostId = usersInRoom.filter((p) => p.host)[0].id;
      const room = await getRoom(user.roomCode);
      const coup = new Coup([]);
      coup.loadJson(room.gameState);
      const playerIndex = coup.state.players.findIndex((p) => p.id === client.playerId);
      assert(playerIndex > -1);
      const validAction = coup.isActionLegal(playerIndex, action);
      console.log('Valid action ', validAction);
      console.log('Valid actions ', coup.state.actions);
      if (validAction) {
        coup.doAction(playerIndex, action);
        await setGameStateForRoom(user.roomCode, coup.dumpJson());
      }
      const { actionStack, actions, players, hands, currTurn, actionList, waitingOnPlayers }: GameState = coup.state;
      const gameState = { actionStack, actions, players, currTurn, hands, actionList, waitingOnPlayers };

      safeRoomEmit(user.roomCode, 'game-state', {
        roomCode: user.roomCode,
        players: usersInRoom,
        gameState,
        hostId,
      });
    }

    async function resolveAction() {
      console.log(`${client.playerId} trying to resolve action on top of stack`);
      const user = await getUser(client.playerId);
      const usersInRoom = await getUsersInRoom(user.roomCode);
      const hostId = usersInRoom.filter((p) => p.host)[0].id;
      const room = await getRoom(user.roomCode);
      const coup = new Coup([]);
      coup.loadJson(room.gameState);
      coup.resolve();
      await setGameStateForRoom(user.roomCode, coup.dumpJson());

      const { actionStack, actions, players, hands, currTurn, actionList, waitingOnPlayers }: GameState = coup.state;
      const gameState = { actionStack, actions, players, currTurn, hands, actionList, waitingOnPlayers };

      safeRoomEmit(user.roomCode, 'game-state', {
        roomCode: user.roomCode,
        players: usersInRoom,
        gameState,
        hostId,
      });
    }

    async function restartGame() {
      console.log(`${client.playerId} trying to resolve action on top of stack`);
      const user = await getUser(client.playerId);
      const usersInRoom = await getUsersInRoom(user.roomCode);
      const hostId = usersInRoom.filter((p) => p.host)[0].id;
      const room = await getRoom(user.roomCode);
      const coup = new Coup([]);
      coup.loadJson(room.gameState);
      coup.resolve();
      await setGameStateForRoom(user.roomCode, coup.dumpJson());

      const { actionStack, actions, players, hands, currTurn, actionList, waitingOnPlayers }: GameState = coup.state;
      const gameState = { actionStack, actions, players, currTurn, hands, actionList, waitingOnPlayers };

      safeRoomEmit(user.roomCode, 'game-state', {
        roomCode: user.roomCode,
        players: usersInRoom,
        gameState,
        hostId,
      });
    }
  });
}

function shuffle<T>(array: Array<T>): Array<T> {
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
