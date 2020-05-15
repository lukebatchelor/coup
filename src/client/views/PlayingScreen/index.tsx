import React, { useContext, useState, useEffect } from 'react';
import { makeStyles, Container, AppBar, Box, Toolbar, ButtonGroup, Button, Typography } from '@material-ui/core';
import { PlayerContext, SocketContext } from '../../contexts';
import { ShowHandBar, ShowHandDrawer } from './ShowHandBar';
import { Phase, State, getStateInfo } from './types';
import { Actions } from './Actions';

const useStyles = makeStyles((theme) => ({}));

type PlayingScreenProps = {};
export function PlayingScreen(props: PlayingScreenProps) {
  const classes = useStyles();
  const [playerInfo] = useContext(PlayerContext);
  const socket = useContext(SocketContext);
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
      <Actions state={state} />
      <ShowHandBar openHandDrawer={openHandDrawer} />
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
