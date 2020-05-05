import React from 'react';
import { makeStyles, Paper, Box, Typography, Button } from '@material-ui/core';

import { State, getStateInfo, Action } from './types';

const useStyles = makeStyles((theme) => ({
  actionButton: {
    marginTop: theme.spacing(2),
  },
}));

function lastActionToInfoText(state: State) {
  const { lastAction, me, isMyTurn, curTurnName } = getStateInfo(state);
  const playerName = state.players[player].nickName;
  const nameOrYou = (targetIdx: number) => {
    const targetPlayer = state.players[targetIdx];
    return targetPlayer.id === me.id ? 'you' : targetPlayer.nickName;
  };

  if (!lastAction) {
    return isMyTurn ? "It's your turn!" : `Waiting for player ${curTurnName}`;
  }

  const { action, player } = lastAction;

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

function blockOrChallengeText(action: Action) {
  if (action.blockable && action.challengable) {
    return 'Would you like to block or challenge?';
  } else if (action.blockable) {
    return 'Would you like to block?';
  } else if (action.challengable) {
    return 'Would you like to challenge?';
  }
  return '';
}

function renderActions(state: State, playerIdx: number) {
  const actions = state.actions[playerIdx];
  return (
    <>
      {actions.generalActions && renderActionGroup('General Actions', actions.generalActions)}
      {actions.characterActions && renderActionGroup('Character Actions', actions.characterActions)}
      {actions.bluffActions && renderActionGroup('Bluff Actions', actions.bluffActions)}
    </>
  );
}

function renderActionGroup(groupName: string, actions: Array<Action>) {
  return (
    actions.length > 0 && (
      <Box mb={4}>
        <Typography variant="h6">{groupName}</Typography>
        {actions.map((action, idx) => (
          <ActionButton action={action} text={action.type} key={`actions-${idx}`} onClick={(a) => console.log(a)} />
        ))}
      </Box>
    )
  );
}

type ActionButtonProps = {
  text: string;
  subText?: string;
  action: Action;
  onClick: (action: Action) => void;
};
function ActionButton(props: ActionButtonProps) {
  const classes = useStyles();
  return (
    <Button
      fullWidth
      variant="contained"
      color="primary"
      className={classes.actionButton}
      onClick={() => props.onClick(props.action)}
    >
      {props.text}
    </Button>
  );
}

// Component that just displays the current instructions to the player
// or more information about the last move
type PlayingInfoTextProps = {
  state: State;
};
export function PlayingInfoText(props: PlayingInfoTextProps) {
  const classes = useStyles();
  const { state } = props;
  const { isMyTurn, curTurnName, lastAction, me } = getStateInfo(state);
  let text = '';
  console.log(me);

  return (
    <>
      <Paper>
        <Box p={2} mt={2}>
          <Typography>{lastActionToInfoText(state)}</Typography>
        </Box>
      </Paper>
      <Box mt={4}>{renderActions(state, me.index)}</Box>
    </>
  );
}
