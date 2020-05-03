export type Player = { index: number; coins: number; nickName: string; id: string };
export type Phase =
  | 'Action'
  | 'Action_Played'
  | 'Blocked_Action'
  | 'Challenged_Action'
  | 'Challenged_Block_Action'
  | 'Pre_Resolving'
  | 'Resolving'
  | 'Challenged_Action_Failed'
  | 'Challenged_Action_Succeeded'
  | 'Challenged_Block_Action_Failed'
  | 'Challenged_Block_Action_Succeeded';
export type State = {
  players: Array<Player>;
  deck: Array<Card>;
  hands: Array<[CardInHand, CardInHand]>;
  currTurn: number;
  currTurnActions: Array<PlayerAction>;
  resolutionActions: Array<ResolutionAction>;
  phase: Phase;
  actions: Array<PlayableActions>;
};

// Cards
export type Card = 'Captain' | 'Contessa' | 'Duke' | 'Assassin' | 'Ambassador';
export type CardInHand = { card: Card; flipped: boolean };
const allCards: Array<Card> = ['Captain', 'Contessa', 'Duke', 'Assassin', 'Ambassador'];
const fullDeck = allCards.reduce(function (result, curr) {
  return result.concat([curr, curr, curr]);
}, []);

// Actions
export type ChallengeAction = { type: 'Challenge'; blockable: false; challengable: false };
export type BlockAction = { type: 'Block'; blockable: false; challengable: true; card: Card };
export type RevealAction = { type: 'Reveal'; blockable: false; challengable: false; card: Card };
export type DiscardAction = { type: 'Discard'; blockable: false; challengable: false; card: Card };

export type ResolutionAction =
  | { type: 'Gain Coins'; gainingPlayer: number; coins: number }
  | { type: 'Lose Coins'; losingPlayer: number; coins: number }
  | { type: 'Steal'; gainingPlayer: number; losingPlayer: number; coins: number }
  | { type: 'Reveal'; player: number; card: Card }
  | { type: 'Exchange'; player: number; numberOfCards: number }
  | { type: 'Blocked'; blockingPlayer: number };

export type Action =
  | { type: 'Income'; blockable: false; challengable: false }
  | { type: 'Foreign Aid'; blockable: true; challengable: false }
  | { type: 'Coup'; blockable: false; challengable: false; target: number }
  | { type: 'Tax'; blockable: false; challengable: true }
  | { type: 'Assassinate'; blockable: true; challengable: true; target: number }
  | { type: 'Exchange'; blockable: false; challengable: true }
  | { type: 'Steal'; blockable: true; challengable: true; target: number; coins: number }
  | ChallengeAction
  | BlockAction
  | RevealAction
  | DiscardAction;

export type PlayerAction = { player: number; action: Action };

export type ActionPhaseActions = {
  generalActions: Array<Action>;
  characterActions: Array<Action>;
  bluffActions: Array<Action>;
};
export type ActionPlayedPhaseActions = {
  challengeActions: Array<ChallengeAction>;
  blockActions: Array<BlockAction>;
  bluffBlockActions: Array<BlockAction>;
};
export type BlockedActionPhaseActions = {
  challengeActions: Array<ChallengeAction>;
};

export type ChallengedActionPhaseActions = {
  revealActions: Array<RevealAction>;
};

export type ChallengedBlockActionPhaseActions = {
  revealActions: Array<RevealAction>;
};

export type ChallengedActionFailedPhaseActions = {
  revealActions: Array<RevealAction>;
};

export type ChallengedActionSucceededPhaseActions = {
  revealActions: Array<RevealAction>;
};

export type PreResolvingActions = { revealActions: Array<RevealAction> } | { discardActions: Array<DiscardAction> };

export type PlayableActions =
  | ActionPhaseActions
  | ActionPlayedPhaseActions
  | BlockedActionPhaseActions
  | ChallengedActionPhaseActions
  | ChallengedBlockActionPhaseActions
  | ChallengedActionFailedPhaseActions
  | ChallengedActionSucceededPhaseActions
  | PreResolvingActions;

export function getStateInfo(state: State) {
  const id = localStorage.getItem('id');
  const isMyTurn = state.players[state.currTurn].id === id;
  const curTurnName = state.players[state.currTurn].nickName;
  const lastAction = state.currTurnActions[state.currTurnActions.length - 1];
  const me = state.players.find((p) => p.id === id);

  return {
    isMyTurn,
    curTurnName,
    lastAction,
    me,
  };
}
