import React, { useContext, useState, useEffect } from 'react';
import { makeStyles, Paper, Box, Typography, Button } from '@material-ui/core';

import { getStateInfo } from './types';
import { SocketContext } from '../../contexts';

const useStyles = makeStyles((theme) => ({
  actionButton: {
    marginTop: theme.spacing(2),
  },
}));

function getCardForAction(action: Action): Card {
  switch (action.type) {
    case 'Steal':
      return 'Captain';
    case 'Tax':
      return 'Duke';
    case 'Exchange':
      return 'Ambassador';
    case 'Assassinate':
      return 'Assassin';
    case 'Block':
      return action.card;
  }
}

function getTargetPlayer(action: Action, state: GameState, me: any, isHost: boolean) {
  if (action.type === 'Coup' || action.type === 'Steal' || action.type === 'Assassinate') {
    const targetPlayer = state.players[action.target];
    const targetPlayerName = !isHost && targetPlayer.id === me.id ? 'you' : targetPlayer.nickname;
    const targetPlayerId = targetPlayer.id;

    return {
      targetPlayer,
      targetPlayerId,
      targetPlayerName,
    };
  }
  return {
    targetPlayer: null,
    targetPlayerId: '',
    targetPlayerName: '',
  };
}

export function actionToText(playerAction: PlayerAction, state: GameState): string {
  const { isHost, me, isMyTurn, curTurnName, lastAction } = getStateInfo(state);

  if (!playerAction) {
    return !isHost && isMyTurn ? "It's your turn!" : `Waiting for ${curTurnName} to choose an action`;
  }

  const { action, player } = playerAction;
  const playerName = state.players[player].nickname;
  const hasChooseActions = isHost ? false : Boolean(state.actions[me.index].chooseActions);
  const playerIsOrYouAre = !isHost && state.players[player].id === me.id ? `You are` : `${playerName} is`;
  const { targetPlayerName, targetPlayerId } = getTargetPlayer(action, state, me, isHost);
  const playerIsTarget = !isHost && targetPlayerId === me.id;
  const isOwnAction = !isHost && state.players[player].id === me.id;

  const aOrAn = (thing: string) => {
    if (!thing) return '####';
    return /^[aeiou]/.test(thing.toLowerCase()) ? `an ${thing}` : `a ${thing}`;
  };
  const capitalise = ([first, ...rest]: string) => {
    if (!first) return '';
    return [first.toUpperCase(), ...rest].join('');
  };
  switch (action.type) {
    case 'Income':
      return `${playerIsOrYouAre} collecting income (+1 coin)`;
    case 'Foreign Aid':
      return `${playerIsOrYouAre} collecting foreign aid (+2 coins)`;
    case 'Coup':
      return `${playerIsOrYouAre} paying 7 coins to stage a coup against ${targetPlayerName}`;
    case 'Tax':
      return `${playerIsOrYouAre} collecting tax as the Duke (+3 coins)`;
    case 'Assassinate':
      return `${playerIsOrYouAre} paying 3 coins to assasinate ${targetPlayerName}`;
    case 'Exchange':
      return `${playerIsOrYouAre} exchanging cards with the court deck`;
    case 'Steal':
      return `${playerIsOrYouAre} stealing coins from ${targetPlayerName}`;
    case 'Challenge':
      const challengedAction = state.actionList[state.actionList.findIndex((a) => a.action.type === 'Challenge') - 1];
      const challengedCard = getCardForAction(challengedAction.action);
      const challengedPlayer = state.players[challengedAction.player].nickname;
      if (hasChooseActions) return `${playerIsOrYouAre} claiming you don't have ${aOrAn(challengedCard)}`;
      return `${playerIsOrYouAre} claiming ${challengedPlayer} doesn't have ${aOrAn(challengedCard)}`;
    case 'Block':
      return `${playerIsOrYouAre} blocking the action using ${aOrAn(action.card)}`;
    case 'Revealing Influence':
      return `Error: Revealing influence shouldn't end up in the action list`;
    case 'Resolved Action':
    case 'Resolving':
      return 'End of turn';
    case 'Declare Winner':
      if (isOwnAction) {
        return 'You win!';
      } else {
        return `${playerName} wins!`;
      }
    case 'Choose':
      if (action.reason === 'Exchange')
        return `${capitalise(playerName)} exchanged ${action.cards.length} cards with the court deck`;
      if (action.reason === 'Assassination') {
        if (isOwnAction) {
          return `You were assassinated`;
        }
        return `${capitalise(playerName)} was assassinated and revealed ${aOrAn(action.cards[0])}`;
      }
      if (action.reason === 'Coup')
        return `The coup against ${playerName} succeeded, revealing ${aOrAn(action.cards[0])}`;
      if (action.reason === 'Failed Bluff') {
        if (isOwnAction) {
          return `You were caught bluffing!`;
        }
        return `${capitalise(playerName)} was caught bluffing and revealed ${aOrAn(action.cards[0])}`;
      }
      if (action.reason === 'Beaten Challenge') {
        if (isOwnAction) {
          return `You weren't bluffing! Your opponent must now reveal an influence!`;
        }
        return `${capitalise(playerName)} wasn't bluffing, they revealed ${aOrAn(action.cards[0])}`;
      }
      if (action.reason === 'Failed Challenge') {
        const reversedActions = state.actionList.reverse();
        const lastChallengeIdx = reversedActions.findIndex((a) => a.action.type === 'Challenge');
        const challengedAction = reversedActions[lastChallengeIdx + 1];
        return `The challenge failed. ${actionToText(challengedAction, state)}`;
      }

      // Fallback?? Shouldn't hit this?
      return `Error: action not handled`;
  }
}

/**
 * Helper function for adding custom labels for certain actions (i.e ones with targets)
 */
function actionToString(action: Action, state: GameState, secondaryAction: Action['type']) {
  if (secondaryAction) {
    if (action.type === 'Coup') return `Coup ${state.players[action.target].nickname}`;
    if (action.type === 'Assassinate') return `Assasinate ${state.players[action.target].nickname}`;
    if (action.type === 'Steal') return `Steal from ${state.players[action.target].nickname}`;
  }
  if (action.type === 'Block') return `Block with ${action.card}`;

  return action.type;
}

function isTargettedAction(action: Action) {
  return action.type === 'Coup' || action.type === 'Assassinate' || action.type === 'Steal';
}

type ActionGroupProps = {
  groupName: string;
  actions: Array<Action>;
  onActionSelected: (action: Action) => void;
  state: GameState;
  secondaryAction: Action['type'];
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'secondary';
};
function ActionGroup(props: ActionGroupProps) {
  const {
    actions,
    groupName,
    onActionSelected,
    state,
    secondaryAction,
    variant = 'contained',
    color = 'primary',
  } = props;
  const classes = useStyles();
  const actionsToRender: Array<Action> = actions.reduce((dedupedActions, action) => {
    if (secondaryAction) return [...dedupedActions, action];
    if (!dedupedActions.find((a: Action) => a.type === action.type)) {
      return [...dedupedActions, action];
    }
    return dedupedActions;
  }, []);

  return (
    actionsToRender.length > 0 && (
      <Box mb={4}>
        <Typography variant="h6">{groupName}</Typography>
        {actionsToRender.map((action, idx) => (
          <Button
            fullWidth
            variant={variant}
            color={color}
            key={`action-${idx}`}
            className={classes.actionButton}
            onClick={() => onActionSelected(action)}
            disabled={action.type === 'Assassinate' && action.disabled}
          >
            {actionToString(action, state, secondaryAction)}
          </Button>
        ))}
        {secondaryAction && (
          <Button
            fullWidth
            variant="outlined"
            color={color}
            key={`action-back`}
            className={classes.actionButton}
            onClick={() => onActionSelected(null)}
          >
            Back
          </Button>
        )}
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
  // set when we are doing a 2 part action (ie coup -> coup Bob)
  const [secondaryAction, setSecondaryAction] = useState<Action['type']>(null);
  const socket = useContext(SocketContext);
  const { isMyTurn, curTurnName, lastAction, me } = getStateInfo(state);
  const actions = state.actions[me.index];
  const { generalActions, characterActions, bluffActions } = actions;
  const secondaryActions = secondaryAction
    ? [...generalActions, ...characterActions, ...bluffActions].filter((action) => action.type === secondaryAction)
    : [];

  useEffect(() => {
    setSecondaryAction(null);
  }, [state]);

  const onActionSelected = (action: Action) => {
    // massive hack, but we pass null as the action to represent "Back" being clicked
    // in a secondary action
    if (!action) {
      setSecondaryAction(null);
      return;
    }
    if (isTargettedAction(action) && !secondaryAction) {
      setSecondaryAction(action.type);
    } else {
      socket.emit('player-action', { action });
    }
  };

  return (
    <>
      <Paper>
        <Box p={2} mt={2}>
          {state.actionList.length === 0 && (
            <Typography align="center" gutterBottom>
              {actionToText(lastAction, state)}
            </Typography>
          )}
          {state.actionList.map((action, actionIdx) => (
            <Typography gutterBottom align="center" key={actionIdx}>
              {actionToText(action, state)}
            </Typography>
          ))}
          {actions.chooseActions && lastAction.action.type !== 'Exchange' && (
            <Typography align="center" gutterBottom>
              Choose an influence to reveal below
            </Typography>
          )}
          {state.waitingOnPlayers.length > 0 && <Typography align="center">Waiting on other players...</Typography>}
        </Box>
      </Paper>
      <Box mt={4} mb={10}>
        {secondaryAction && (
          <ActionGroup
            groupName={`${secondaryAction} Actions`}
            actions={secondaryActions}
            onActionSelected={onActionSelected}
            state={state}
            secondaryAction={secondaryAction}
          />
        )}
        {!secondaryAction && generalActions && (
          <ActionGroup
            groupName="General Actions"
            actions={generalActions}
            onActionSelected={onActionSelected}
            state={state}
            secondaryAction={secondaryAction}
          />
        )}
        {!secondaryAction && characterActions && (
          <ActionGroup
            groupName="Character Actions"
            actions={characterActions}
            onActionSelected={onActionSelected}
            state={state}
            secondaryAction={secondaryAction}
          />
        )}
        {!secondaryAction && bluffActions && (
          <ActionGroup
            groupName="Bluff Actions"
            actions={bluffActions}
            onActionSelected={onActionSelected}
            state={state}
            secondaryAction={secondaryAction}
          />
        )}
      </Box>
    </>
  );
}
