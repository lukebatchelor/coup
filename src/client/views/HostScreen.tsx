import React, { useContext, useEffect, useState } from 'react';
import { makeStyles, Container, Paper, Typography, Grid, Avatar, Box, Button } from '@material-ui/core';
import { getStateInfo } from './PlayingScreen/types';
import { SocketContext, PlayerContext } from '../contexts';
import { actionToText } from './PlayingScreen/Actions';

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
}));

function getResolvedState(state: GameState, resolutionCount: number) {
  if (state.actionStack.length !== 1 || state.actionStack[0].action.type !== 'Resolving') {
    return state;
  }
  // create copy of state to modify
  const resolvedState: GameState = JSON.parse(JSON.stringify(state));

  return resolvedState;
}

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
  const [resolutionCount, setResolutionCount] = useState<number>(0);

  function resolveAction() {
    return socket.emit('resolve-action');
    // if (resolutionCount === state.resolutionActions.length) {
    // }
    setResolutionCount(resolutionCount + 1);
  }

  useEffect(() => {
    socket.on('game-state', ({ gameState }) => {
      console.log('game-state', { gameState });
      setState(gameState);

      if (noPlayerMoves(gameState)) {
        setTimeout(() => resolveAction, 3000);
      }
      if (gameState.actionStack.length === 0) {
        setResolutionCount(0);
      }
    });
    socket.emit('player-loaded-game', { roomCode: playerInfo.roomCode });
  }, []);

  if (!state) return <div>Loading...</div>;

  const resolvedState = getResolvedState(state, resolutionCount);
  const debugResolveText = `Resolution action: ${resolutionCount}/???`;

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
        {resolvedState.players.map((player, playerIdx) => {
          const { deltaCoins } = player;
          const deltaCoinsStr = deltaCoins && (deltaCoins > 0 ? `+ ${deltaCoins}` : `- ${deltaCoins}`);
          const deltaCoinsFontColor = deltaCoins && deltaCoins > 0 ? 'green' : 'red';
          return (
            <Grid item xs={3} className={player.eliminated && classes.eliminated} key={playerIdx}>
              <Paper className={classes.paper}>
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
                  {resolvedState.hands[player.index].slice(0, 2).map((card, cardIdx) => {
                    const cardUrl = card.flipped || card.replacing ? `/${card.card}.png` : '/card-back.png';
                    return (
                      <Grid item xs={6} key={cardIdx}>
                        <img src={cardUrl} className={classes.card} alt={card.card} />
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
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
