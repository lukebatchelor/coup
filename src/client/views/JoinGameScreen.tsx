import React, { useState, useContext } from 'react';
import { makeStyles, Container, TextField, Box, Button } from '@material-ui/core';
import { PlayerContext, CurViewContext } from '../contexts';

import { Views } from './Views';
import { getRoom } from '../api';

const useStyles = makeStyles((theme) => ({}));

type JoinGameScreenProps = {};
export function JoinGameScreen(props: JoinGameScreenProps) {
  const classes = useStyles();
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);
  const [, setCurView] = useContext(CurViewContext);

  const [nickName, setNickName] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>(playerInfo.roomCode);
  const [helperText, setHelperText] = useState<string>('(four letter code given to you by your host)');
  const [roomCodeError, setRoomCodeError] = useState<boolean>(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check the room exists
    const maybeRoom = await getRoom(roomCode);
    if (!maybeRoom.room) {
      setHelperText('No room found with id: ' + roomCode);
      setRoomCodeError(true);
    } else {
      setPlayerInfo({ roomCode, nickName });
      setCurView(Views.Lobby);
    }
  };

  const onNickNameChanged = (e: React.ChangeEvent<HTMLInputElement>) => setNickName(e.target.value);
  const onRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCodeError(false);
    setHelperText('(four letter code given to you by your host)');
    setRoomCode(e.target.value);
  };
  const disableRoomCodeInput = playerInfo.isHost;

  return (
    <Container maxWidth="sm">
      <form noValidate onSubmit={onSubmit}>
        <TextField variant="outlined" fullWidth label="Nickname" value={nickName || ''} onChange={onNickNameChanged} />
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          label="Room Code"
          value={roomCode || ''}
          disabled={disableRoomCodeInput}
          onChange={onRoomCodeChange}
          helperText={helperText}
          error={roomCodeError}
        />

        <Box mt={3}>
          <Button type="submit" fullWidth variant="contained" color="primary">
            Join Game
          </Button>
        </Box>
      </form>
    </Container>
  );
}
