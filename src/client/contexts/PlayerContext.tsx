import React, { useState } from 'react';

type PlayerInfo = {
  nickName: string;
  roomCode: string;
  isHost: boolean;
  inGame: boolean;
  // color: string;
  // avatarUrl: string;
};
type SetPlayerInfoFn = (info: Partial<PlayerInfo>) => void;
const defaultPlayerInfo: PlayerInfo = {
  nickName: '',
  roomCode: '',
  isHost: false,
  inGame: false,
};

const PlayerContext = React.createContext<[PlayerInfo, SetPlayerInfoFn]>([defaultPlayerInfo, () => {}]);

const PlayerProvider: React.FC = (props) => {
  const [curPlayerInfo, setCurPlayerInfo] = useState<PlayerInfo>(defaultPlayerInfo);
  // we'll export a setter that doesnt require setting the whole state
  const mergeCurPlayerInfo: SetPlayerInfoFn = (info) => {
    if (info.nickName === null) {
      info.nickName = '';
    }
    if (info.roomCode === null) {
      info.roomCode = '';
    }
    setCurPlayerInfo({ ...curPlayerInfo, ...info });
  };

  return <PlayerContext.Provider value={[curPlayerInfo, mergeCurPlayerInfo]}>{props.children}</PlayerContext.Provider>;
};

export { PlayerContext, PlayerProvider };
