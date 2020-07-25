import React, { useContext, useEffect, useState } from 'react';
import { makeStyles, Container, Paper, Typography, Grid, Avatar, Box, Button } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import AccessAlarmsIcon from '@material-ui/icons/AccessAlarms';
import clsx from 'clsx';

import { getStateInfo } from './PlayingScreen/types';
import { SocketContext, PlayerContext, CurViewContext } from '../contexts';
import { actionToText } from './PlayingScreen/Actions';
import { Views } from './Views';

const NO_ACTION_TIMEOUT_MS = 10000;
const RESOLUTION_PAUSE_MS = 3000;

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
  eliminated: {
    filter: 'grayscale(1)',
  },
  seeThrough: {
    opacity: 0.3,
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
  const [curView, setCurView] = useContext(CurViewContext);
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);
  const [state, setState] = useState<GameState>(null);
  const [resolutionCount, setResolutionCount] = useState<number>(0);
  const [timer, setTimer] = useState(null);

  function resolveAction() {
    return socket.emit('resolve-action');
  }

  const resolveIfNoMoves = () => {
    if (state && noPlayerMoves(state) && !timer) {
      const timeout = setTimeout(() => {
        resolveAction();
        setTimer(null);
      }, 3000);
      setTimer(timeout);
    }
  };

  useEffect(() => {
    socket.on('game-state', ({ gameState }) => {
      console.log('game-state', { gameState });
      setState(gameState);

      if (gameState.actionStack.length === 0) {
        setResolutionCount(0);
      }
    });
    socket.emit('player-loaded-game', { roomCode: playerInfo.roomCode });
  }, []);

  useEffect(resolveIfNoMoves, [state]);

  if (!state) return <div>Loading...</div>;

  const waitingOnAnyPlayer = state.waitingOnPlayers.length > 0;
  const debugResolveText = `Resolution action: ${resolutionCount}/???`;
  const exitClicked = () => {
    socket.emit('exit-game');
    setCurView(Views.StartScreen);
  };
  const playAgainClicked = () => {
    socket.emit('restart-game');
  };

  return (
    <Container maxWidth="lg">
      {state.actionList.length === 0 && (
        <Typography variant="h5" gutterBottom align="center">
          {`${getStateInfo(state).curTurnName}'s turn`}
        </Typography>
      )}
      {state.actionList.map((action, actionIdx) => (
        <Typography variant="h5" gutterBottom align="center" key={actionIdx}>
          {actionToText(action, state)}
        </Typography>
      ))}

      <Box mt={2} />
      <Grid container spacing={3} justify="center">
        {state.players.map((player, playerIdx) => {
          const { deltaCoins } = player;
          const deltaCoinsStr = deltaCoins && (deltaCoins > 0 ? `+ ${deltaCoins}` : `- ${-deltaCoins}`);
          const deltaCoinsFontColor = deltaCoins && deltaCoins > 0 ? 'green' : 'red';
          const isWaitingOnPlayer = state.waitingOnPlayers.includes(player.index);

          return (
            <Grid item xs={3} className={clsx({ [classes.eliminated]: player.eliminated })} key={playerIdx}>
              <Paper
                className={clsx(classes.paper, { [classes.seeThrough]: waitingOnAnyPlayer && !isWaitingOnPlayer })}
              >
                <Box display="flex" flexDirection="row" alignItems="center" mb={2}>
                  <Avatar alt={player.nickname} src="/" />
                  <Box ml={1} />
                  <Typography>{player.nickname}</Typography>
                  <Box display="flex" flexDirection="row" alignItems="center" ml="auto">
                    <img src="coin.png" className={classes.coin}></img>
                    <Typography>
                      {player.coins} <span style={{ color: deltaCoinsFontColor }}>{deltaCoinsStr || ''}</span>
                    </Typography>
                  </Box>
                </Box>
                <Grid container>
                  {state.hands[player.index].slice(0, 2).map((card, cardIdx) => {
                    const cardUrl = card.flipped || card.replacing ? `/${card.card}.png` : '/card-back.png';
                    return (
                      <Grid item xs={6} key={cardIdx}>
                        <img src={cardUrl} className={classes.card} alt={card.card} />
                      </Grid>
                    );
                  })}
                </Grid>
                {waitingOnAnyPlayer && (
                  <Grid container justify="center">
                    <Box display="flex">
                      {isWaitingOnPlayer ? <AccessAlarmsIcon /> : <CheckCircleOutlineIcon />}
                      {isWaitingOnPlayer && (
                        <Box ml={1}>
                          <Typography>Waiting on player...</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      <Box mt={4} />
      {state.actionList.length === 1 && state.actionList[0].action.type === 'Declare Winner' && (
        <Grid container justify="center" spacing={4}>
          <Grid item>
            <Button variant="contained" onClick={exitClicked}>
              Exit
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" onClick={playAgainClicked}>
              Play Again
            </Button>
          </Grid>
        </Grid>
      )}
      <Button
        type="button"
        variant="contained"
        color="primary"
        disabled={state.actionStack.length === 0}
        onClick={resolveAction}
      >
        DEBUG_{debugResolveText}
      </Button>
    </Container>
  );
}
