import React, { useContext, useState, useEffect } from 'react';
import { makeStyles, Container, AppBar, Box, Toolbar, ButtonGroup, Button, Typography } from '@material-ui/core';
import ConfettiGenerator from 'confetti-js';

import { PlayerContext, SocketContext } from '../../contexts';
import { ShowHandBar, ShowHandDrawer } from './ShowHandBar';
import { getStateInfo } from './types';
import { Actions } from './Actions';

const useStyles = makeStyles((theme) => ({}));

type PlayingScreenProps = {};
export function PlayingScreen(props: PlayingScreenProps) {
  const classes = useStyles();
  const [playerInfo] = useContext(PlayerContext);
  const socket = useContext(SocketContext);
  const [handOpen, setHandOpen] = useState<boolean>(false);
  const [state, setState] = useState<GameState>(null);
  const [hostDisconnected, setHostDisconnected] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  useEffect(() => {
    socket.on('game-state', ({ gameState, hostId }) => {
      console.log('game-state', gameState);
      setState(gameState);
      if (!hostId) {
        setHostDisconnected(true);
      }
      if (
        gameState.actionList.length &&
        gameState.actionList[gameState.actionList.length - 1].action.type === 'Declare Winner'
      ) {
        setShowConfetti(true);
      } else {
        setShowConfetti(false);
      }
    });
    socket.on('host-disconnected', () => {
      console.log('host-disconnected');
      setHostDisconnected(true);
    });
    socket.emit('player-loaded-game', { roomCode: playerInfo.roomCode });

    return function cleanUp() {
      socket.off('game-state');
      socket.off('host-disconnected');
    };
  }, []);

  React.useEffect(() => {
    console.log('confetti', showConfetti);
    const confettiSettings = { target: 'confetti-canvas', start_from_edge: true };
    const confetti = new ConfettiGenerator(confettiSettings);
    if (showConfetti) {
      confetti.render();
    }

    return () => confetti.clear();
  }, [showConfetti]);

  const openHandDrawer = () => setHandOpen(true);
  const closeHandDrawer = () => setHandOpen(false);
  if (!state) {
    return <div>Loading</div>;
  }

  const { me } = getStateInfo(state);
  const myHand = state.hands[me.index];
  const chooseActions = state.actions[me.index].chooseActions;
  const cards = chooseActions ? chooseActions.cards.map((c) => ({ card: c, flipped: false })) : myHand;
  const allowSelection = chooseActions ? (cards.length === 2 || cards.length === 1 ? 1 : 2) : 0;
  const onSelection = (selection: Array<number>) => {
    const selectedCards = selection.map((selectedIdx) => chooseActions.cards[selectedIdx]);
    if (selection.length === 1) {
      const action = chooseActions.actions.find((action) => action.cards[0] === selectedCards[0]);
      socket.emit('player-action', { action });
    } else {
      const action: ChooseAction = chooseActions.actions.find((action) => {
        return (
          (selectedCards[0] === action.cards[0] && selectedCards[1] === action.cards[1]) ||
          (selectedCards[0] === action.cards[1] && selectedCards[1] === action.cards[0])
        );
      });

      if (!action) alert('cant find action');
      socket.emit('player-action', { action });
    }

    closeHandDrawer();
  };
  return (
    <Container maxWidth="md">
      {hostDisconnected && <Typography>⚠️ Host has disconnected. Click 🏠 to return to the start screen</Typography>}
      <Actions state={state} />
      <ShowHandBar openHandDrawer={openHandDrawer} coins={me.coins} playerName={me.nickname} />
      <ShowHandDrawer
        open={handOpen || !!chooseActions}
        closeHandDrawer={closeHandDrawer}
        allowSelection={allowSelection}
        onSelection={onSelection}
        cards={cards}
      />
    </Container>
  );
}
