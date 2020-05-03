import React, { useContext, useState } from 'react';
import { makeStyles, Container, AppBar, Box, Toolbar, ButtonGroup, Button, Typography } from '@material-ui/core';
import { PlayerContext, SocketContext } from '../../contexts';
import { ShowHandBar, ShowHandDrawer } from '../../components/ShowHandBar';
import { Phase } from './types';
import { PlayingInfoText } from '../../components/PlayingInfoText';
const useStyles = makeStyles((theme) => ({}));

/**
 * type Phase =
  | 'Action'
    - my turn: display action actions
    - not turn: display waiting
  | 'Action_Played'
    - my turn: waiting
    - not turn: display challenge, block and bluffs
  | 'Blocked_Action'
    - my turn: display challenge actions
    - not turn: display challenge actions
  | 'Challenged_Action'
    - my turn: display card to prove or lose
    - not my turn: display waiting
  | 'Challenged_Block_Action'
    - challenging me (have reveal action): display card to prove or lose
    - not challenging me (no reveal action): display waiting
  | 'Pre_Resolving'
    - display pre-resolve actions or waiting (reveal or discard)
      [exchanging, assasinating, couping]
  | 'Resolving';
    - display whole summary (or just waiting)
 */

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

  return (
    <Container maxWidth="md">
      <Typography variant="h4">
        Playing ({phase},{curTurn})
      </Typography>
      <PlayingInfoText />
      <ShowHandBar openHandDrawer={openHandDrawer} />
      <ShowHandDrawer
        open={handOpen}
        closeHandDrawer={closeHandDrawer}
        allowSelection={2}
        onSelection={(a: Array<number>) => {
          console.log('selected', a);
        }}
      />
    </Container>
  );
}
