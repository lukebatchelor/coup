import React from 'react';
import { makeStyles, Paper, Box, Typography, Button } from '@material-ui/core';

import {
  State,
  getStateInfo,
  Action,
  Player,
  ActionPhaseActions,
  ActionPlayedPhaseActions,
  BlockedActionPhaseActions,
  ChallengedActionPhaseActions,
  ChallengedBlockActionPhaseActions,
  ChallengedActionFailedPhaseActions,
  ChallengedActionSucceededPhaseActions,
} from '../views/PlayingScreen/types';

const useStyles = makeStyles((theme) => ({
  actionButton: {
    marginTop: theme.spacing(2),
  },
}));

const state: State = {
  players: [
    { index: 0, id: 'fc416b45-2eed-4799-8eb6-ce8722bc0439', nickName: 'Luke', coins: 4 },
    { index: 1, id: '05e1e7ce-f722-44f5-a86a-fa8d623a6db2', nickName: 'Guest', coins: 4 },
  ],
  deck: [],
  hands: [
    [
      { flipped: false, card: 'Ambassador' },
      { flipped: false, card: 'Assassin' },
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

function actionToInfoText(state: State) {
  const { lastAction, me } = getStateInfo(state);
  const { action, player } = lastAction;
  const playerName = state.players[player].nickName;
  const nameOrYou = (targetIdx: number) => {
    const targetPlayer = state.players[targetIdx];
    return targetPlayer.id === me.id ? 'you' : targetPlayer.nickName;
  };

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
      return `${playerName} is stealing ${action.coins} coins from ${nameOrYou(action.target)}`;
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
  const { phase } = state;
  if (phase === 'Action') {
    const actions = (state.actions[playerIdx] as unknown) as ActionPhaseActions;
    const { generalActions, bluffActions, characterActions } = actions;
    return (
      <>
        {renderActionGroup('General Actions', generalActions)}
        {renderActionGroup('Character Actions', characterActions)}
        {renderActionGroup('Bluff Actions', bluffActions)}
      </>
    );
  } else if (phase === 'Action_Played') {
    const actions = (state.actions[playerIdx] as unknown) as ActionPlayedPhaseActions;
    const { challengeActions, blockActions, bluffBlockActions } = actions;
    return (
      <>
        {renderActionGroup('Challenge Actions', challengeActions)}
        {renderActionGroup('Block Actions', blockActions)}
        {renderActionGroup('Bluff Actions', bluffBlockActions)}
      </>
    );
  } else if (phase === 'Challenged_Action') {
    const actions = (state.actions[playerIdx] as unknown) as ChallengedActionPhaseActions;
    const { revealActions } = actions;
    return <>{renderActionGroup('Challenge Actions', revealActions)}</>;
  } else if (phase === 'Challenged_Block_Action') {
    const actions = (state.actions[playerIdx] as unknown) as ChallengedBlockActionPhaseActions;
    const { revealActions } = actions;
    return <>{renderActionGroup('Challenge Actions', revealActions)}</>;
  } else if (phase === 'Challenged_Action_Failed') {
    const actions = (state.actions[playerIdx] as unknown) as ChallengedActionFailedPhaseActions;
    const { revealActions } = actions;
    return <>{renderActionGroup('Challenge Actions', revealActions)}</>;
  } else if (phase === 'Challenged_Action_Succeeded') {
    const actions = (state.actions[playerIdx] as unknown) as ChallengedActionSucceededPhaseActions;
    const { revealActions } = actions;
    return <>{renderActionGroup('Challenge Actions', revealActions)}</>;
  }
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
type PlayingInfoTextProps = {};
export function PlayingInfoText(props: PlayingInfoTextProps) {
  const classes = useStyles();
  const { isMyTurn, curTurnName, lastAction, me } = getStateInfo(state);
  const { phase } = state;
  let text = '';

  return (
    <>
      <Paper>
        <Box p={2} mt={2}>
          {phase === 'Action' && isMyTurn && <Typography>Select an action for your turn</Typography>}
          {phase === 'Action' && !isMyTurn && <Typography>Waiting for player {curTurnName}...</Typography>}
          {phase === 'Action_Played' && isMyTurn && <Typography>Waiting for a challenge or block...</Typography>}
          {phase === 'Action_Played' && !isMyTurn && (
            <>
              <Typography paragraph>{actionToInfoText(state)}</Typography>
              <Typography>{blockOrChallengeText(lastAction.action)}</Typography>
            </>
          )}
        </Box>
      </Paper>
      <Box mt={4}>{renderActions(state, me.index)}</Box>
    </>
  );
}
