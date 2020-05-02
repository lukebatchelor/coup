import Database from 'sqlite-async';

const db = Database.open('coup.sqlite');

export type HostMode = 'Host' | 'Player' | null;
export type UserRecord = { _id: number; id: string; nickName: string; roomCode: string; hostMode: HostMode };
export type RoomRecord = { _id: number; roomCode: string; inGame: boolean; gameState: string };

export async function createInitialTables(): Promise<void> {
  try {
    await (await db).exec(
      `CREATE TABLE IF NOT EXISTS rooms 
    (
      _id INTEGER PRIMARY KEY AUTOINCREMENT, 
      roomCode VARCHAR(5) UNIQUE,
      inGame Boolean DEFAULT false,
      gameState TEXT
      )`
    );
    console.log('Created rooms table');
    await (await db).exec(
      `CREATE TABLE IF NOT EXISTS users 
      (
        _id INTEGER PRIMARY KEY AUTOINCREMENT, 
        id VARCHAR(255) UNIQUE, 
        nickName VARCHAR(255), 
        roomCode VARCHAR(5) REFERENCES rooms(id),
        host BOOLEAN NOT NULL DEFAULT false
      )`
    );
    console.log('Created user table');
  } catch (err) {
    console.log('Error ', err);
  }
}

export async function addUser(userId: string): Promise<void> {
  try {
    return (await db).run('INSERT INTO users (id) VALUES (?)', [userId]);
  } catch (error) {
    console.log('Error ', error);
  }
}

export async function createRoom(roomId: string): Promise<void> {
  try {
    return (await db).run('INSERT INTO rooms (roomCode) VALUES (?)', [roomId]);
  } catch (error) {
    console.log('Error ', error);
  }
}

export async function getUser(userId: string): Promise<UserRecord> {
  try {
    return (await db).get('SELECT * FROM users where id = ?', [userId]);
  } catch (error) {
    console.log('Error', error);
  }
}

export async function getRoom(roomId: string): Promise<RoomRecord> {
  try {
    return (await db).get('SELECT * FROM rooms where roomCode = ?', [roomId]);
  } catch (error) {
    console.log('Error', error);
  }
}

export async function addUserToRoom(
  roomCode: string,
  userId: string,
  nickName: string,
  hostMode: HostMode
): Promise<void> {
  try {
    return (await db).run('UPDATE users set roomCode = ?, nickName = ?, hostMode = ? WHERE id = ?', [
      roomCode,
      nickName,
      hostMode,
      userId,
    ]);
  } catch (error) {
    console.log('Error ', error);
  }
}

export async function getUsersInRoom(roomCode: string): Promise<Array<UserRecord>> {
  try {
    return (await db).all('SELECT * FROM users WHERE roomCode = ?', [roomCode]);
  } catch (error) {
    console.log('Error ', error);
  }
}

export async function removeRoomFromUser(userId: string): Promise<void> {
  try {
    return (await db).run('UPDATE users set roomCode = null, hostMode = null WHERE id = ?', [userId]);
  } catch (error) {
    console.log('Error ', error);
  }
}

export async function startGameForRoom(roomCode: string, gameState: string): Promise<void> {
  try {
    return (await db).run('UPDATE rooms set inGame = True, gameState = ? WHERE roomCode = ?', [gameState, roomCode]);
  } catch (error) {
    console.log('Error ', error);
  }
}

export async function setGameStateForRoom(roomCode: string, gameState: string): Promise<void> {
  try {
    return (await db).run('UPDATE rooms set gameState = ? WHERE roomCode = ?', [gameState, roomCode]);
  } catch (error) {
    console.log('Error ', error);
  }
}
