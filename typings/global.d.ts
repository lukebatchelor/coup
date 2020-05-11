// declare var io: any;

declare type User = { id: string; nickName: string; roomCode: string; host: boolean };
declare type GameState = Omit<State, 'deck'>;

declare type HandshakeMessage = { id: string };
declare type DisconnectMessage = {};
declare type WelcomeMessage = { id: string; nickName: string; roomCode: string; host?: boolean; inGame: boolean };
declare type PlayerJoinRoomMessage = { roomCode: string; nickName: string; host: boolean };
declare type PlayerLeaveRoomMessage = { roomCode: string };
declare type AllPlayersReadyMessage = { roomCode: string };
declare type PlayerLoadedGameMessage = { roomCode: string };
declare type RoomCreatedMessage = { roomCode: string };
declare type RoomStatusMessage = { roomCode: string; players: Array<User> };
declare type PlayerActionMessage = { action: Action };
declare type GameStateMessage = { roomCode: string; players: Array<User>; gameState: GameState; hostId: string };

declare type SocketEvents = {
  handshake: HandshakeMessage;
  disconnect: DisconnectMessage;
  welcome: WelcomeMessage;
  'create-room': never;
  'room-created': RoomCreatedMessage;
  'player-join-room': PlayerJoinRoomMessage;
  'player-leave-room': PlayerLeaveRoomMessage;
  'all-players-ready': AllPlayersReadyMessage;
  'player-loaded-game': PlayerLoadedGameMessage;
  'room-status': RoomStatusMessage;
  'start-game': never;
  'game-state': GameStateMessage;
  'resolve-action': never;
  'player-action': PlayerActionMessage;
};
