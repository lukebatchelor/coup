import React, { useContext, useState } from 'react';
import { makeStyles, Paper, Box, Typography, Button } from '@material-ui/core';

import { getStateInfo } from './types';
import { SocketContext } from '../../contexts';

const useStyles = makeStyles((theme) => ({
  actionButton: {
    marginTop: theme.spacing(2),
  },
}));

export function actionToText(playerAction: PlayerAction, state: GameState) {
  const { isHost, me, isMyTurn, curTurnName, lastAction } = getStateInfo(state);

  if (!playerAction) {
    return !isHost && isMyTurn ? "It's your turn!" : `Waiting for ${curTurnName} to choose an action`;
  }

  const { action, player } = playerAction;
  const playerName = state.players[player].nickname;
  const hasChooseActions = isHost ? false : Boolean(state.actions[me.index].chooseActions);
  const playerIsOrYouAre = !isHost && state.players[player].id === me.id ? `You are` : `${playerName} is`;
  const targetName = (targetIdx: number, capitalise: boolean = false) => {
    const targetPlayer = state.players[targetIdx];
    if (!isHost && targetPlayer.id === me.id) {
      return capitalise ? 'You' : 'you';
    }
    return targetPlayer.nickname;
  };
  const aOrAn = (thing: string) => (/^[aeiou]/.test(thing.toLowerCase()) ? `an ${thing}` : `a ${thing}`);

  switch (action.type) {
    case 'Income':
      return `${playerIsOrYouAre} collecting income (+1 coin)`;
    case 'Foreign Aid':
      return `${playerIsOrYouAre} collecting foreign aid (+2 coins)`;
    case 'Coup':
      return `${playerIsOrYouAre} paying 7 coins to stage a coup against ${targetName(action.target)}`;
    case 'Tax':
      return `${playerIsOrYouAre} collecting tax as the Duke (+3 coins)`;
    case 'Assassinate':
      return `${playerIsOrYouAre} paying 3 coins to assasinate ${targetName(action.target)}`;
    case 'Exchange':
      return `${playerIsOrYouAre} exchanging cards with the deck`;
    case 'Steal':
      return `${playerIsOrYouAre} stealing coins from ${targetName(action.target)}`;
    case 'Challenge':
      if (hasChooseActions)
        return `${playerIsOrYouAre} calling your bluff. Choose a card to either prove your claim or to discard for bluffing!`;
      return `${playerIsOrYouAre} challenging the action!`;
    case 'Block':
      return `${playerIsOrYouAre} blocking the action using  ${aOrAn(action.card)}`;
    case 'Exchanging Influence':
      if (isMyTurn) return 'Select two cards to put back in the deck';
      return `${playerIsOrYouAre} exchanging cards with the deck`;
    case 'Revealing Influence':
      if (hasChooseActions) return 'Choose a card to reveal';
      return `${targetName(player, true)} must reveal an influence!`;
    case 'Resolved Action':
    case 'Resolving':
      return 'End of turn';
    case 'Declare Winner':
      return isMyTurn ? 'You win!' : `${targetName(player)} wins!`;
    case 'Choose':
      if (action.reason === 'Exchange')
        return `${targetName(player, true)} exchanged ${action.cards.length} cards with the court deck`;
      if (action.reason === 'Assassination')
        return `${targetName(player, true)} was assassinated and revealed  ${aOrAn(action.cards[0])}`;
      if (action.reason === 'Coup')
        return `The coup against ${targetName(player)} succeeded, revealing  ${aOrAn(action.cards[0])}`;
      if (action.reason === 'Failed Bluff')
        return `${targetName(player, true)} was caught bluffing and revealed ${aOrAn(action.cards[0])}`;
      if (action.reason === 'Beaten Challenge')
        return `${targetName(player, true)} wasn't bluffing, they revealed ${aOrAn(action.cards[0])}`;
      if (action.reason === 'Failed Challenge') {
        const prevAction = state.actionList[state.actionList.length - 2];
        return `${targetName(player, true)} revealed ${aOrAn(action.cards[0])}, the challenge fails`;
      }

      // Fallback?? Shouldn't hit this?
      return `${targetName(player)} revealed ${aOrAn(action.cards[0])}`;
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
};
function ActionGroup(props: ActionGroupProps) {
  const { actions, groupName, onActionSelected, state, secondaryAction } = props;
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
            variant="contained"
            color="primary"
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
            variant="contained"
            color="primary"
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
      setSecondaryAction(null);
      socket.emit('player-action', { action });
    }
  };

  return (
    <>
      <Paper>
        <Box p={2} mt={2}>
          <Typography>{actionToText(lastAction, state)}</Typography>
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
