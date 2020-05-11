import React, { useContext, useState, useEffect } from 'react';
import { makeStyles, Container, AppBar, Box, Toolbar, ButtonGroup, Button, Typography } from '@material-ui/core';
import { PlayerContext, SocketContext } from '../../contexts';
import { ShowHandBar, ShowHandDrawer } from './ShowHandBar';
import { Phase, State, getStateInfo } from './types';
import { PlayingInfoText } from './PlayingInfoText';
import { stat } from 'fs';
const useStyles = makeStyles((theme) => ({}));

const state: State = {
  players: [
    { index: 0, id: '74e012fb-3c23-422d-a07d-7db7e75071df', nickName: 'Luke', coins: 4 },
    { index: 1, id: 'd6f0aaae-9c72-44b6-a63e-190c7dbe8939', nickName: 'Gary', coins: 4 },
  ],
  deck: [],
  hands: [
    [
      { flipped: false, card: 'Ambassador' },
      { flipped: false, card: 'Assassin' },
    ],
    [
      { flipped: false, card: 'Captain' },
      { flipped: false, card: 'Contessa' },
    ],
  ],
  currTurn: 0,
  // currTurnActions: [{ player: 0, action: { type: 'Tax', blockable: false, challengable: true } }],
  currTurnActions: [],
  phase: 'Action',
  actions: [
    {
      generalActions: [
        { type: 'Income', blockable: false, challengable: false },
        { type: 'Foreign Aid', blockable: true, challengable: false },
      ],
      characterActions: [{ type: 'Exchange', blockable: false, challengable: true }],
      bluffActions: [],
    },
    {
      generalActions: [{ type: 'Income', blockable: false, challengable: false }],
      characterActions: [],
      bluffActions: [],
    },
  ],
  resolutionActions: [],
};

function noPlayerMoves(state: GameState) {
  return state.actions.every((actions) => {
    const { characterActions, bluffActions, generalActions, chooseActions } = actions;

    return (
      (!characterActions || characterActions.length === 0) &&
      (!bluffActions || bluffActions.length === 0) &&
      (!generalActions || generalActions.length === 0) &&
      !chooseActions
    );
  });
}

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
      if (noPlayerMoves) {
        setTimeout(() => {
          socket.emit();
        }, 3000);
      }
    });
    socket.emit('player-loaded-game', { roomCode: playerInfo.roomCode });
  }, []);

  const openHandDrawer = () => setHandOpen(true);
  const closeHandDrawer = () => setHandOpen(false);
  if (!state) {
    return 'Loading';
  }
  const { lastAction, me } = getStateInfo(state);
  const chooseAction = lastAction ? lastAction.action.type === 'Choose' : null;

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
