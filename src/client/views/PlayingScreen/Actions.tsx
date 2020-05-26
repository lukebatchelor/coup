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

function lastActionToInfoText(state: GameState) {
  const { lastAction, me, isMyTurn, curTurnName } = getStateInfo(state);
  const nameOrYou = (targetIdx: number) => {
    const targetPlayer = state.players[targetIdx];
    return targetPlayer.id === me.id ? 'you' : targetPlayer.nickname;
  };

  if (!lastAction) {
    return isMyTurn ? "It's your turn!" : `Waiting for player ${curTurnName}`;
  }

  const { action, player } = lastAction;
  const playerName = state.players[player].nickname;
  const hasChooseActions = !!state.actions[me.index].chooseActions;

  const playerIsOrYouAre = state.players[player].id === me.id ? `You are` : `${playerName} is`;
  switch (action.type) {
    case 'Income':
      return `${playerIsOrYouAre} collecting income (+1 coin)`;
    case 'Foreign Aid':
      return `${playerIsOrYouAre} collecting foreign aid (+2 coins)`;
    case 'Coup':
      return `${playerIsOrYouAre} paying 7 coins  to stage a coup against ${nameOrYou(action.target)}`;
    case 'Tax':
      return `${playerIsOrYouAre} collecting tax as the Duke (+3 coins)`;
    case 'Assassinate':
      return `${playerIsOrYouAre} paying 3 coins to assasinate ${nameOrYou(action.target)}`;
    case 'Exchange':
      return `${playerIsOrYouAre} exchanging cards with the deck`;
    case 'Steal':
      return `${playerIsOrYouAre} stealing coins from ${nameOrYou(action.target)}`;
    case 'Challenge':
      if (hasChooseActions)
        return `${playerIsOrYouAre} challenging your action. Choose a card to either prove your claim or to discard for bluffing!`;
      return `${playerIsOrYouAre} challenging the action!`;
    case 'Block':
      return `${playerIsOrYouAre} blocking the action using a ${action.card}`;
    case 'Exchanging Influence':
      if (isMyTurn) return 'Select two cards to put back in the deck';
      return `${playerIsOrYouAre} exchanging cards with the deck`;
    case 'Revealing Influence':
      if (hasChooseActions) return 'Choose a card to reveal';
      return `${nameOrYou(player)} must reveal a card!`;
    case 'Resolved Action':
      return 'End of turn';
    case 'Choose':
      if (action.reason === 'Exchange') return `${playerName} exchanged ${action.cards.length} cards`;
      if (action.reason === 'Assisination') return `${playerName} revealed ${action.cards[0]} for assasination`;
      if (action.reason === 'Coup') return `${playerName} revealed ${action.cards[0]} for coup`;
      if (action.reason === 'Failed Bluff') return `${playerName} revealed ${action.cards[0]} for failed bluff`;
      if (action.reason === 'Failed Challenge')
        return `${playerName} revealed ${action.cards[0]} due to a incorrect challenge`;

      // Fallback?? Shouldn't hit?
      return `${playerName} revealed a ${action.cards[0]}`;
  }
}

/**
 * Helper function for adding custom labels for certain actions (i.e ones with targets)
 */
function actionToString(action: Action, state: GameState) {
  if (action.type === 'Coup') return `Coup ${state.players[action.target].nickname}`;
  if (action.type === 'Assassinate') return `Assasinate ${state.players[action.target].nickname}`;
  if (action.type === 'Steal') return `Steal from ${state.players[action.target].nickname}`;
  if (action.type === 'Block') return `Block with ${action.card}`;

  return action.type;
}

type ActionGroupProps = {
  groupName: string;
  actions: Array<Action>;
  onActionSelected: (action: Action) => void;
  state: GameState;
};
function ActionGroup(props: ActionGroupProps) {
  const { actions, groupName, onActionSelected, state } = props;
  const classes = useStyles();

  return (
    actions.length > 0 && (
      <Box mb={4}>
        <Typography variant="h6">{groupName}</Typography>
        {actions.map((action, idx) => (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            className={classes.actionButton}
            onClick={() => onActionSelected(action)}
            disabled={action.type === 'Assassinate' && action.disabled}
          >
            {actionToString(action, state)}
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
  const socket = useContext(SocketContext);
  const { isMyTurn, curTurnName, lastAction, me } = getStateInfo(state);
  const actions = state.actions[me.index];
  const { generalActions, characterActions, bluffActions } = actions;

  const onActionSelected = (action: Action) => {
    socket.emit('player-action', { action });
  };

  return (
    <>
      <Paper>
        <Box p={2} mt={2}>
          <Typography>{lastActionToInfoText(state)}</Typography>
        </Box>
      </Paper>
      <Box mt={4}>
        {generalActions && (
          <ActionGroup
            groupName="General Actions"
            actions={generalActions}
            onActionSelected={onActionSelected}
            state={state}
          />
        )}
        {characterActions && (
          <ActionGroup
            groupName="Character Actions"
            actions={characterActions}
            onActionSelected={onActionSelected}
            state={state}
          />
        )}
        {bluffActions && (
          <ActionGroup
            groupName="Bluff Actions"
            actions={bluffActions}
            onActionSelected={onActionSelected}
            state={state}
          />
        )}
      </Box>
    </>
  );
}
