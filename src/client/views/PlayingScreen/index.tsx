import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core';
import { PlayerContext } from '../../contexts/PlayerContext';

const useStyles = makeStyles((theme) => ({}));

type PlayingScreenProps = {};
export function PlayingScreen(props: PlayingScreenProps) {
  const classes = useStyles();
  const [playerInfo] = useContext(PlayerContext);

  return <div>PlayingScreen {JSON.stringify(playerInfo)}</div>;
}
