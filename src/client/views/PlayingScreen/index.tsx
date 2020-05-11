import React, { useContext, useState, useEffect } from 'react';
import { makeStyles, Container, AppBar, Box, Toolbar, ButtonGroup, Button, Typography } from '@material-ui/core';
import { PlayerContext, SocketContext } from '../../contexts';
import { ShowHandBar, ShowHandDrawer } from './ShowHandBar';
import { Phase, State, getStateInfo } from './types';
import { PlayingInfoText } from './PlayingInfoText';

const useStyles = makeStyles((theme) => ({}));

type PlayingScreenProps = {};
export function PlayingScreen(props: PlayingScreenProps) {
  const classes = useStyles();
  const [playerInfo] = useContext(PlayerContext);
  const socket = useContext(SocketContext);
  const phase: Phase = 'Action';
  const curTurn = 0;
  const [handOpen, setHandOpen] = useState<boolean>(false);
  const [state, setState] = useState<GameState>(null);

  useEffect(() => {
    socket.on('game-state', ({ gameState }) => {
      console.log('game-state', gameState);
      setState(gameState);
    });
    socket.emit('player-loaded-game', { roomCode: playerInfo.roomCode });
  }, []);

  const openHandDrawer = () => setHandOpen(true);
  const closeHandDrawer = () => setHandOpen(false);
  if (!state) {
    return <div>Loading</div>;
  }
  const { me } = getStateInfo(state);
  const chooseAction = !!state.actions[me.index].chooseActions;

  return (
    <Container maxWidth="md">
      <Typography variant="h4">
        Playing ({phase},{curTurn})
      </Typography>
      <PlayingInfoText state={state} />
      <ShowHandBar openHandDrawer={openHandDrawer} />
      <ShowHandDrawer
        open={handOpen || chooseAction}
        closeHandDrawer={closeHandDrawer}
        allowSelection={2}
        onSelection={(a: Array<number>) => {
          console.log('selected', a);
        }}
        cards={state.hands[me.index]}
      />
    </Container>
  );
}
