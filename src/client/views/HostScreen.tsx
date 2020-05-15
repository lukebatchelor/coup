import React, { useContext, useEffect, useState } from 'react';
import { makeStyles, Container, Paper, Typography, Grid, Avatar, Box, Button } from '@material-ui/core';
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
type HostScreenProps = {};
export function HostScreen(props: HostScreenProps) {
  const classes = useStyles();
  const socket = useContext(SocketContext);
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);
  const [state, setState] = useState<GameState>(null);

  function resolveAction() {
    socket.emit('resolve-action');
  }

  useEffect(() => {
    socket.on('game-state', ({ gameState }) => {
      console.log('game-state', { gameState });
      setState(gameState);

      if (noPlayerMoves(gameState)) {
        setTimeout(() => resolveAction, 3000);
      }
    });
    socket.emit('player-loaded-game', { roomCode: playerInfo.roomCode });
  }, []);

  if (!state) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3} justify="center">
        {state.players.map((player) => (
          <Grid item xs={3}>
            <Paper className={classes.paper}>
              <Box display="flex" flexDirection="row" alignItems="center" mb={2}>
                <Avatar alt={player.nickname} src="/" />
                <Box ml={1} />
                <Typography>{player.nickname}</Typography>
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
      <Button
        type="button"
        variant="contained"
        color="primary"
        disabled={state.actionStack.length === 0}
        onClick={resolveAction}
      >
        [DEBUG] Resolve Action
      </Button>
    </Container>
  );
}
