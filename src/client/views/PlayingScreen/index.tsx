import React, { useContext, useState } from 'react';
import { makeStyles, Container, AppBar, Box, Toolbar, ButtonGroup, Button, Typography } from '@material-ui/core';
import { PlayerContext, SocketContext } from '../../contexts';
import { ShowHandBar, ShowHandDrawer } from './ShowHandBar';
import { Phase, State, getStateInfo } from './types';
import { PlayingInfoText } from './PlayingInfoText';
const useStyles = makeStyles((theme) => ({}));

const state: State = {
  players: [
    { index: 0, id: '69854f7b-9368-4748-b566-4b5a88c802c4', nickName: 'Luke', coins: 4 },
    { index: 1, id: 'ca055a1c-240e-422f-a904-9c399f42aee0', nickName: 'Gary', coins: 4 },
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

type PlayingScreenProps = {};
export function PlayingScreen(props: PlayingScreenProps) {
  const classes = useStyles();
  const [playerInfo] = useContext(PlayerContext);
  const socket = useContext(SocketContext);
  const phase: Phase = 'Action';
  const curTurn = 0;
  const [handOpen, setHandOpen] = useState<boolean>(false);

  const openHandDrawer = () => setHandOpen(true);
  const closeHandDrawer = () => setHandOpen(false);
  const { lastAction } = getStateInfo(state);
  const chooseAction = lastAction.action.type === 'Choose';

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
      />
    </Container>
  );
}
