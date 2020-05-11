import React, { useContext, useEffect } from 'react';
import { makeStyles, Container, Paper, Typography, Grid, Avatar, Box } from '@material-ui/core';
import { State } from './PlayingScreen/types';
import { SocketContext, PlayerContext } from '../contexts';

const useStyles = makeStyles((theme) => ({
  paper: { padding: theme.spacing(2) },
  coin: {
    height: theme.spacing(5),
    width: theme.spacing(5),
  },
  card: {
    // marginLeft: theme.spacing(1),
    // marginRight: theme.spacing(1),
    padding: theme.spacing(1),

    width: '100%',
  },
}));

const state: State = {
  players: [
    { index: 0, id: '69854f7b-9368-4748-b566-4b5a88c802c4', nickName: 'Luke', coins: 4 },
    { index: 1, id: 'ca055a1c-240e-422f-a904-9c399f42aee0', nickName: 'Gary', coins: 9 },
    { index: 2, id: 'ca055a1c-240e-422f-a904-9c399f42aee0', nickName: 'Red', coins: 2 },
  ],
  deck: [],
  hands: [
    [
      { flipped: false, card: 'Ambassador' },
      { flipped: false, card: 'Assassin' },
    ],
    [
      { flipped: true, card: 'Captain' },
      { flipped: false, card: 'Contessa' },
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

type HostScreenProps = {};
export function HostScreen(props: HostScreenProps) {
  const classes = useStyles();
  const socket = useContext(SocketContext);
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);

  useEffect(() => {
    socket.on('game-state', (data) => {
      console.log(data);
    });
    socket.emit('player-loaded-game', { roomCode: playerInfo.roomCode });
  }, []);

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3} justify="center">
        {state.players.map((player) => (
          <Grid item xs={3}>
            <Paper className={classes.paper}>
              <Box display="flex" flexDirection="row" alignItems="center" mb={2}>
                <Avatar alt={player.nickName} src="/" />
                <Box ml={1} />
                <Typography>{player.nickName}</Typography>
                <Box display="flex" flexDirection="row" alignItems="center" ml="auto">
                  <img src="coin.png" className={classes.coin}></img>
                  <Typography>{player.coins}</Typography>
                </Box>
              </Box>
              <Grid container>
                {state.hands[player.index].map((card) => {
                  const cardUrl = card.flipped ? '/card.png' : '/card-back.png';
                  return (
                    <Grid item xs={6}>
                      <img src={cardUrl} className={classes.card} alt={card.card} />
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
