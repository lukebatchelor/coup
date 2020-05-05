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
  actions: Array<AvailableActions>;
};

// Cards
export type Card = 'Captain' | 'Contessa' | 'Duke' | 'Assassin' | 'Ambassador';
export type CardInHand = { card: Card; flipped: boolean };
const allCards: Array<Card> = ['Captain', 'Contessa', 'Duke', 'Assassin', 'Ambassador'];
const fullDeck = allCards.reduce(function (result, curr) {
  return result.concat([curr, curr, curr]);
}, []);

// Actions

export type ResolutionAction =
  | { type: 'Gain Coins'; gainingPlayer: number; coins: number }
  | { type: 'Lose Coins'; losingPlayer: number; coins: number }
  | { type: 'Steal'; gainingPlayer: number; losingPlayer: number; coins: number }
  | { type: 'Flip'; player: number; card: Card }
  | { type: 'Exchange'; player: number; numberOfCards: number }
  | { type: 'Draw'; player: number }
  | { type: 'Discard'; player: number; card: Card }
  | { type: 'Blocked'; blockingPlayer: number };

// General Actions
export type IncomeAction = { type: 'Income'; blockable: false; challengable: false };
export type ForeinAidAction = { type: 'Foreign Aid'; blockable: true; challengable: false };
export type CoupAction = { type: 'Coup'; blockable: false; challengable: false; target: number };
export type ChallengeAction = { type: 'Challenge'; blockable: false; challengable: false };
export type RevealAction = { type: 'Reveal'; blockable: false; challengable: false; card: Card };

// Character/Bluff Actions
export type TaxAction = { type: 'Tax'; blockable: false; challengable: true };
export type AssassinateAction = { type: 'Assassinate'; blockable: true; challengable: true; target: number };
export type ExchangeAction = { type: 'Exchange'; blockable: false; challengable: true };
export type StealAction = { type: 'Steal'; blockable: true; challengable: true; target: number };
export type BlockAction = { type: 'Block'; blockable: false; challengable: true; card: Card };

// Other actions that can be on the stack but are not put there by players.
export type RevealingInfluence = { type: 'Revealing Influence'; blockable: false; challengable: false };

// ChooseAction - used after assassinate/coup/challenge/exchange
export type ChooseAction = { type: 'Choose'; blockable: false; challengable: false; cards: Array<Card> };

export type GeneralAction = IncomeAction | ForeinAidAction | CoupAction | ChallengeAction | RevealAction;
export type CharacterAction = TaxAction | AssassinateAction | ExchangeAction | StealAction | BlockAction;

export type Action = GeneralAction | CharacterAction | ChooseAction | RevealingInfluence;

export type PlayerAction = {
  player: number;
  action: GeneralAction | CharacterAction | ChooseAction | RevealingInfluence;
};

export type AvailableActions = {
  generalActions: Array<GeneralAction>;
  characterActions: Array<CharacterAction>;
  bluffActions: Array<CharacterAction>;
  chooseActions?: {
    cards: Array<Card>;
    actions: Array<ChooseAction>;
  };
};

export function getStateInfo(state: State) {
  const id = localStorage.getItem('id');
  const isMyTurn = state.players[state.currTurn].id === id;
  const curTurnName = state.players[state.currTurn].nickName;
  const lastAction = state.currTurnActions.length ? state.currTurnActions[state.currTurnActions.length - 1] : null;
  const me = state.players.find((p) => p.id === id);

  return {
    isMyTurn,
    curTurnName,
    lastAction,
    me,
  };
}
