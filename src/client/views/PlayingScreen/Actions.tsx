import React, { useContext, useState } from 'react';
import { makeStyles, Paper, Box, Typography, Button } from '@material-ui/core';

import { getStateInfo } from './types';
import { SocketContext } from '../../contexts';

const useStyles = makeStyles((theme) => ({
  actionButton: {
    marginTop: theme.spacing(2),
  },
}));

// List of actions that require targets (require two steps in performing the action)
type ActionWithTarget = 'Coup' | 'Assassinate' | 'Steal';
const actionsWithTargets: Array<ActionWithTarget> = ['Coup', 'Assassinate', 'Steal'];
type Target = { index: number; nickname: string };

function lastActionToInfoText(state: GameState, targetAction: ActionWithTarget) {
  const { lastAction, me, isMyTurn, curTurnName } = getStateInfo(state);
  const nameOrYou = (targetIdx: number) => {
    const targetPlayer = state.players[targetIdx];
    return targetPlayer.id === me.id ? 'you' : targetPlayer.nickname;
  };

  if (!lastAction) {
    return isMyTurn ? "It's your turn!" : `Waiting for player ${curTurnName}`;
  }
  if (targetAction) {
    return `Select a target for ${targetAction}`;
  }

  const { action, player } = lastAction;
  const playerName = state.players[player].nickname;

  switch (action.type) {
    case 'Income':
      return `${playerName} is collecting income (+1 coin)`;
    case 'Foreign Aid':
      return `${playerName} is collecting foreign aid (+2 coins)`;
    case 'Coup':
      return `${playerName} is paying 7 coins  to stage a coup against ${nameOrYou(action.target)}`;
    case 'Tax':
      return `${playerName} is collecting tax as the Duke (+3 coins)`;
    case 'Assassinate':
      return `${playerName} is paying 3 coins to assasinate ${nameOrYou(action.target)}`;
    case 'Exchange':
      return `${playerName} is exchanging cards with the deck`;
    case 'Steal':
      return `${playerName} is stealing coins from ${nameOrYou(action.target)}`;
    case 'Challenge':
      return `${playerName} is challenging the action!`;
    case 'Block':
      return `${playerName} is blocking the action using a ${action.card}`;
  }
}

type ActionGroupProps = {
  groupName: string;
  actions: Array<Action>;
  onActionSelected: (action: Action) => void;
};
function ActionGroup(props: ActionGroupProps) {
  const { actions, groupName, onActionSelected } = props;
  const classes = useStyles();

  // filter out actions with targets to only show as one option
  const actionsToRender = actions.reduce((prev, cur) => {
    // @ts-ignore
    if (!actionsWithTargets.includes(cur.type)) return [...prev, cur];
    if (!prev.find((action) => action.type === cur.type)) return [...prev, cur];
    return prev;
  }, [] as Array<Action>);
  const playerIdxToName = (idx: number) => 'foo';
  const actionToDisplay =
    groupName !== 'Select Target' ? (action: Action) => action.type : (action: Action) => playerIdxToName(1);
  return (
    actions.length > 0 && (
      <Box mb={4}>
        <Typography variant="h6">{groupName}</Typography>
        {actionsToRender.map((action, idx) => (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            className={classes.actionButton}
            onClick={() => onActionSelected(action)}
          >
            {action.type}
          </Button>
        ))}
      </Box>
    )
  );
}

type ActionsProps = {
  state: GameState;
};
export function Actions(props: ActionsProps) {
  const classes = useStyles();
  const { state } = props;
  const [targetAction, setTargetAction] = useState<ActionWithTarget>(null);
  const socket = useContext(SocketContext);
  const { isMyTurn, curTurnName, lastAction, me } = getStateInfo(state);
  const actions = state.actions[me.index];
  const { generalActions, characterActions, bluffActions } = actions;

  const onActionSelected = (action: Action) => {
    if (!actionsWithTargets.includes(action.type as ActionWithTarget) || targetAction !== null) {
      return socket.emit('player-action', { action });
    }
    setTargetAction(action.type as ActionWithTarget);
  };

  if (targetAction) {
    const targetActions = [...generalActions, ...characterActions, ...bluffActions].filter(
      (action) => action.type === targetAction
    );
    return (
      <>
        <Paper>
          <Box p={2} mt={2}>
            <Typography>Select a target</Typography>
          </Box>
        </Paper>
        <Box mt={4}>
          <ActionGroup groupName="Select Target" actions={targetActions} onActionSelected={onActionSelected} />
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            className={classes.actionButton}
            onClick={() => setTargetAction(null)}
          >
            Cancel
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Paper>
        <Box p={2} mt={2}>
          <Typography>{lastActionToInfoText(state, targetAction)}</Typography>
        </Box>
      </Paper>
      <Box mt={4}>
        {generalActions && (
          <ActionGroup groupName="General Actions" actions={generalActions} onActionSelected={onActionSelected} />
        )}
        {characterActions && (
          <ActionGroup groupName="Character Actions" actions={characterActions} onActionSelected={onActionSelected} />
        )}
        {bluffActions && (
          <ActionGroup groupName="Bluff Actions" actions={bluffActions} onActionSelected={onActionSelected} />
        )}
      </Box>
    </>
  );
}
