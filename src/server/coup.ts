type Player = { index: number; metadata?: any };

type State = {
  players: Array<Player>;
  deck: Array<Card>;
  hands: Array<[CardInHand, CardInHand]>;
  currTurn: number;
  currTurnActions: Array<Action>;
};

// Cards
type Card = 'Captain' | 'Contessa' | 'Duke' | 'Assassin' | 'Ambassador';
type CardInHand = { card: Card; flipped: boolean };
const allCards: Array<Card> = ['Captain', 'Contessa', 'Duke', 'Assassin', 'Ambassador'];
const fullDeck = allCards.reduce(function (result, curr) {
  return result.concat([curr, curr, curr]);
}, []);

// Actions
type ChallengeAction = { type: 'Challenge'; blockable: false; challengable: false };
type BlockAction = { type: 'Block'; blockable: false; challengable: false };
type Action =
  | { type: 'Income'; blockable: false; challengable: false }
  | { type: 'Foreign Aid'; blockable: true; challengable: false }
  | { type: 'Coup'; blockable: false; challengable: false; target?: number }
  | { type: 'Tax'; blockable: false; challengable: true }
  | { type: 'Assassinate'; blockable: true; challengable: true; target?: number }
  | { type: 'Exchange'; blockable: false; challengable: true; cards: [0] | [1] | [0, 1] }
  | { type: 'Steal'; blockable: true; challengable: true; target?: number }
  | ChallengeAction;

type ActionPhaseActions = {
  generalActions: Array<Action>;
  characterActions: Array<Action>;
  bluffActions: Array<Action>;
};
type ActionPlayedPhaseActions = {
  challengeAction: Array<ChallengeAction>;
  blockActions: Array<BlockAction>;
  bluffBlockActions: Array<BlockAction>;
};
type PlayerActions = ActionPhaseActions | ActionPlayedPhaseActions;

export default class Coup {
  state: State;

  constructor({ numberPlayers }: { numberPlayers: number }) {
    const players = [...Array(numberPlayers).keys()].map((index) => ({ index }));
    const deck = shuffle([...fullDeck]);
    // Give each player two cards to start with.
    const hands = [...Array(numberPlayers).keys()].map(
      (_) =>
        [
          { card: deck.shift(), flipped: false },
          { card: deck.shift(), flipped: false },
        ] as [CardInHand, CardInHand]
    );
    this.state = { players, deck, hands, currTurn: 0, currTurnActions: [] };
  }

  getState(): State {
    return this.state;
  }

  doAction(action: Action): void {}

  getActions(): Array<PlayerActions> {
    const actionStackSize = this.state.currTurnActions.length;
    return this.state.players.map((_, index) => {
      // Empty action stack means we're in the ACTION phase
      if (actionStackSize === 0) {
        return this.getActionPhaseActions(index);
      } else if (actionStackSize === 1) {
        // Action stack of size 1 means we're in the ACTION_PLAYED phase
        return this.getActionPlayedPhaseActions(index);
      }
    });
  }

  getActionPhaseActions(playerIndex: number): ActionPhaseActions {
    // All players that aren't you are valid targets for actions.
    const targets = this.state.players.filter((p) => p.index !== playerIndex).map((p) => p.index);
    // No actions available if it's not your turn.
    if (this.state.currTurn !== playerIndex) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }

    // General actions for player
    const generalActions = [
      { type: 'Income', blockable: false, challengable: false },
      { type: 'Foreign Aid', blockable: true, challengable: false },
      // Add one coup action for each player that is not youself.
      ...targets.map((i) => ({ type: 'Coup', blockable: false, challengable: false, target: i })),
    ] as Array<Action>;

    // characterActions for player
    const characterActions = flatten(
      this.state.hands[playerIndex]
        .filter((card) => !card.flipped)
        .map((card) => this.getActionForCharacter(card.card, targets))
    );

    // bluffActions for player
    const bluffActions = flatten(
      this.getCardsPlayerDoesNotHave(playerIndex).map((card) => this.getActionForCharacter(card, targets))
    );

    return { generalActions, characterActions, bluffActions };
  }

  getActionPlayedPhaseActions(playerIndex: number): ActionPlayedPhaseActions {
    const actionOnStack = this.state.currTurnActions[0];
    // No actions available if it's your turn.
    if (this.state.currTurn === playerIndex) {
      return { challengeAction: null, counterActions: [], bluffCounterActions: [] };
    }
    const challengeAction = actionOnStack.challengable
      ? ({ type: 'Challenge', blockable: false, challengable: false } as ChallengeAction)
      : null;

    const counterActions = getCounterActionsToActionForPlayer(actionOnStack, playerIndex);
    return { challengeAction, counterActions: [], bluffCounterActions: [] };
  }

  getCounterActionsToActionForPlayer(Action): Array<CounterAction> {
    return [];
  }

  drawCardFromDeck() {
    return this.state.deck.shift();
  }

  getActionForCharacter(character: Card, targets: Array<number>): Array<Action> {
    switch (character) {
      case 'Captain':
        return targets.map((i) => ({ type: 'Steal', blockable: true, challengable: true, target: i }));
      case 'Duke':
        return [{ type: 'Tax', blockable: false, challengable: true }];
      case 'Ambassador':
        return [
          { type: 'Exchange', blockable: false, challengable: true, cards: [0] },
          { type: 'Exchange', blockable: false, challengable: true, cards: [1] },
          { type: 'Exchange', blockable: false, challengable: true, cards: [0, 1] },
        ];
      case 'Assassin':
        return targets.map((i) => ({ type: 'Assassinate', blockable: true, challengable: true, target: i }));
      case 'Contessa':
      default:
        return [];
    }
  }

  getCardsPlayerDoesNotHave(playerIndex: number): Array<Card> {
    const playersCards = this.state.hands[playerIndex].map((card) => card.card);
    return allCards.filter((card) => !playersCards.includes(card));
  }
}

function shuffle(array: Array<any>) {
  let counter = array.length;
  while (counter > 0) {
    let index = Math.floor(Math.random() * counter);
    counter--;
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

function flatten(array: Array<Array<any>>): Array<any> {
  return array.reduce((res, curr) => res.concat(...curr), []);
}
