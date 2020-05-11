declare type Player = { index: number; coins: number; nickname: string; id: string; eliminated: boolean };

// Cards
declare type Card = 'Captain' | 'Contessa' | 'Duke' | 'Assassin' | 'Ambassador';
declare type CardInHand = { card: Card; flipped: boolean };

declare type State = {
  players: Array<Player>;
  deck: Array<Card>;
  hands: Array<[CardInHand, CardInHand]>;
  currTurn: number;
  actionStack: Array<PlayerAction>;
  resolutionActions: Array<ResolutionAction>;
  actions: Array<AvailableActions>;
};

// Actions

declare type Flip = { type: 'Flip'; player: number; card: Card };
declare type ResolutionAction =
  | { type: 'Gain Coins'; gainingPlayer: number; coins: number }
  | { type: 'Lose Coins'; losingPlayer: number; coins: number }
  | Flip
  | { type: 'Draw'; player: number }
  | { type: 'Discard'; player: number; card: Card };

// General Actions
declare type IncomeAction = { type: 'Income' };
declare type ForeinAidAction = { type: 'Foreign Aid' };
declare type CoupAction = { type: 'Coup'; target: number };
declare type ChallengeAction = { type: 'Challenge' };
declare type RevealAction = { type: 'Reveal'; card: Card };

// Character/Bluff Actions
declare type TaxAction = { type: 'Tax' };
declare type AssassinateAction = { type: 'Assassinate'; target: number };
declare type ExchangeAction = { type: 'Exchange' };
declare type StealAction = { type: 'Steal'; target: number };
declare type BlockAction = { type: 'Block'; card: Card };

// Other actions that can be on the stack but are not put there by players.
declare type RevealingInfluence = { type: 'Revealing Influence' };
declare type Exchanging = { type: 'Exchanging Influence' };
declare type Resolving = { type: 'Resolving' };
declare type DeclareWinner = { type: 'Declare Winner' };
declare type OtherAction = RevealingInfluence | Exchanging | Resolving | DeclareWinner;

// ChooseAction - used after assassinate/coup/challenge/exchange
declare type ChooseAction = { type: 'Choose'; cards: Array<Card> };

declare type GeneralAction = IncomeAction | ForeinAidAction | CoupAction | ChallengeAction | RevealAction;
declare type CharacterAction = TaxAction | AssassinateAction | ExchangeAction | StealAction | BlockAction;

declare type Action = GeneralAction | CharacterAction | ChooseAction | OtherAction;

declare type PlayerAction = { player: number; action: Action };

declare type AvailableActions = {
  generalActions: Array<GeneralAction>;
  characterActions: Array<CharacterAction>;
  bluffActions: Array<CharacterAction>;
  chooseActions?: {
    cards: Array<Card>;
    actions: Array<ChooseAction>;
  };
};
