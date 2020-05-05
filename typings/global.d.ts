// declare var io: any;
declare type User = { id: string; nickName: string; roomCode: string; host: boolean };

declare type HandshakeMessage = { id: string };
declare type WelcomeMessage = { id: string; nickName: string; roomCode: string; host?: boolean; inGame: boolean };
declare type PlayerJoinRoomMessage = { roomCode: string; nickName: string; host: boolean };
declare type PlayerLeaveRoomMessage = { roomCode: string };
declare type AllPlayersReadyMessage = { roomCode: string };
declare type RoomCreatedMessage = { roomCode: string };
declare type RoomStatusMessage = { roomCode: string; players: Array<User> };

declare type SocketEvents = {
  handshake: HandshakeMessage;
  welcome: WelcomeMessage;
  'create-room': never;
  'room-created': RoomCreatedMessage;
  'player-join-room': PlayerJoinRoomMessage;
  'player-leave-room': PlayerLeaveRoomMessage;
  'all-players-ready': AllPlayersReadyMessage;
  'room-status': RoomStatusMessage;
  'start-game': never;
};
