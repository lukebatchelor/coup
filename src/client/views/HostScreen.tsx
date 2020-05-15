import React, { useContext, useEffect, useState } from 'react';
import { makeStyles, Container, Paper, Typography, Grid, Avatar, Box, Button } from '@material-ui/core';
import { State, getStateInfo } from './PlayingScreen/types';
import { SocketContext, PlayerContext } from '../contexts';

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
}));

function getLastActionText(playerAction: PlayerAction, state: GameState) {
  const { lastAction, curTurnName } = getStateInfo(state);
  if (state.actionStack.length === 0) {
    return `${curTurnName}'s Turn`;
  }
  const { action, player } = playerAction;
  const playerName = state.players[player].nickname;
  const idxToName = (idx: number) => state.players[idx].nickname;

  switch (action.type) {
    case 'Income':
      return `${playerName} is collecting income (+1 coin)`;
    case 'Foreign Aid':
      return `${playerName} is collecting foreign aid (+2 coins)`;
    case 'Coup':
      return `${playerName} is paying 7 coins  to stage a coup against ${idxToName(action.target)}`;
    case 'Tax':
      return `${playerName} is collecting tax as the Duke (+3 coins)`;
    case 'Assassinate':
      return `${playerName} is paying 3 coins to assasinate ${idxToName(action.target)}`;
    case 'Exchange':
      return `${playerName} is exchanging cards with the deck`;
    case 'Steal':
      return `${playerName} is stealing coins from ${idxToName(action.target)}`;
    case 'Challenge':
      return `${playerName} is challenging the action!`;
    case 'Block':
      return `${playerName} is blocking the action using a ${action.card}`;
    case 'Exchanging Influence':
      return `${playerName} is exchanging cards with the deck`;
    case 'Revealing Influence':
      return `${playerName} must reveal a card!`;
    case 'Resolving':
      return 'End of round...';
    case 'Declare Winner':
      return `${playerName} wins!`;
  }
}

function getResolvedState(state: GameState, resolutionCount: number) {
  if (state.actionStack.length !== 1 || state.actionStack[0].action.type !== 'Resolving') {
    return state;
  }
  // create copy of state to modify
  const resolvedState: GameState = JSON.parse(JSON.stringify(state));
  const { resolutionActions } = state;
  for (let i = 0; i < resolutionCount; i++) {
    const action = resolutionActions[i];
    if (action.type === 'Flip') {
      resolvedState.hands[action.player].find((card) => card.card === action.card).flipped = true;
    } else if (action.type === 'Discard') {
    } else if (action.type === 'Draw') {
    } else if (action.type === 'Gain Coins') {
      resolvedState.players[action.gainingPlayer].coins += action.coins;
    } else if (action.type === 'Lose Coins') {
      resolvedState.players[action.losingPlayer].coins -= action.coins;
    }
  }

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
    if (resolutionCount === state.resolutionActions.length) {
      return socket.emit('resolve-action');
    }
    setResolutionCount(resolutionCount + 1);
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

  const resolvedState = getResolvedState(state, resolutionCount);
  const debugResolveText = `Resolution action: ${resolutionCount}/${state.resolutionActions.length}`;
  return (
    <Container maxWidth="lg">
      {state.actionStack.length === 0 && (
        <Typography variant="h5" gutterBottom align="center">
          {`${getStateInfo(state).curTurnName}'s turn`}
        </Typography>
      )}
      {state.actionStack.map((action) => (
        <Typography variant="h5" gutterBottom align="center">
          {getLastActionText(action, state)}
        </Typography>
      ))}

      <Box mt={2} />
      <Grid container spacing={3} justify="center">
        {resolvedState.players.map((player) => (
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
                {resolvedState.hands[player.index].map((card) => {
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
        DEBUG_{debugResolveText}
      </Button>
    </Container>
  );
}
