// declare var io: any;

declare type User = { id: string; nickName: string; roomCode: string; host: boolean };

declare type HandshakeMessage = { id: string };
declare type WelcomeMessage = { id: string; nickName: string; roomCode: string; host?: boolean; inGame: boolean };
declare type PlayerJoinRoomMessage = { roomCode: string; nickName: string; host: boolean };
declare type PlayerLeaveRoomMessage = { roomCode: string };
declare type AllPlayersReadyMessage = { roomCode: string };
declare type RoomCreatedMessage = { roomCode: string };
declare type RoomStatusMessage = { roomCode: string; players: Array<User> };
