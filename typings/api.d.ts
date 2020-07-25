/// <reference types='express-serve-static-core'>

declare type TypedRequest<ReqParam = {}, ReqBody = {}, QueryParams = {}> = {
  params: ReqParam;
  body: ReqBody;
  query: QueryParams;
};
declare type TypedResponse<ResBody = any> = ResBody;

/**
 * ROOMS
 */
declare type Room = { roomCode: string };

// GET /api/rooms/:roomCode
declare type getRoomResponseBody = { room?: Room };
declare type GetRoomRequestParams = { roomCode: string };
declare type GetRoomRequest = TypedRequest<GetRoomRequestParams, {}>;
declare type GetRoomResponse = TypedResponse<getRoomResponseBody>;
