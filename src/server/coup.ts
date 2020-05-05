type Player = { index: number; coins: number; nickname: string; id: string };

type State = {
  players: Array<Player>;
  deck: Array<Card>;
  hands: Array<[CardInHand, CardInHand]>;
  currTurn: number;
  currTurnActions: Array<PlayerAction>;
  resolutionActions: Array<ResolutionAction>;
  actions: Array<AvailableActions>;
};

// Cards
type Card = 'Captain' | 'Contessa' | 'Duke' | 'Assassin' | 'Ambassador';
type CardInHand = { card: Card; flipped: boolean };
const allCards: Array<Card> = ['Captain', 'Contessa', 'Duke', 'Assassin', 'Ambassador'];
const fullDeck = allCards.reduce(function (result, curr) {
  return result.concat([curr, curr, curr]);
}, []);

// Actions

type ResolutionAction =
  | { type: 'Gain Coins'; gainingPlayer: number; coins: number }
  | { type: 'Lose Coins'; losingPlayer: number; coins: number }
  | { type: 'Flip'; player: number; card: Card }
  | { type: 'Draw'; player: number }
  | { type: 'Discard'; player: number; card: Card };

// General Actions
type IncomeAction = { type: 'Income'; blockable: false; challengable: false };
type ForeinAidAction = { type: 'Foreign Aid'; blockable: true; challengable: false };
type CoupAction = { type: 'Coup'; blockable: false; challengable: false; target: number };
type ChallengeAction = { type: 'Challenge'; blockable: false; challengable: false };
type RevealAction = { type: 'Reveal'; blockable: false; challengable: false; card: Card };

// Character/Bluff Actions
type TaxAction = { type: 'Tax'; blockable: false; challengable: true };
type AssassinateAction = { type: 'Assassinate'; blockable: true; challengable: true; target: number };
type ExchangeAction = { type: 'Exchange'; blockable: false; challengable: true };
type StealAction = { type: 'Steal'; blockable: true; challengable: true; target: number };
type BlockAction = { type: 'Block'; blockable: false; challengable: true; card: Card };

// Other actions that can be on the stack but are not put there by players.
type RevealingInfluence = { type: 'Revealing Influence'; blockable: false; challengable: false };
type Exchanging = { type: 'Exchanging Influence'; blockable: false; challengable: false };
type OtherAction = RevealingInfluence | Exchanging;

// ChooseAction - used after assassinate/coup/challenge/exchange
type ChooseAction = { type: 'Choose'; blockable: false; challengable: false; cards: Array<Card> };

type GeneralAction = IncomeAction | ForeinAidAction | CoupAction | ChallengeAction | RevealAction;
type CharacterAction = TaxAction | AssassinateAction | ExchangeAction | StealAction | BlockAction;

type Action = GeneralAction | CharacterAction | ChooseAction | OtherAction;

type PlayerAction = { player: number; action: Action };

type AvailableActions = {
  generalActions: Array<GeneralAction>;
  characterActions: Array<CharacterAction>;
  bluffActions: Array<CharacterAction>;
  chooseActions?: {
    cards: Array<Card>;
    actions: Array<ChooseAction>;
  };
};

export default class Coup {
  state: State;

  constructor(playersList: Array<{ nickname: string; id: string }>) {
    const players = playersList.map(({ nickname, id }, index) => ({
      index,
      coins: 2,
      nickname,
      id,
    }));
    const deck = shuffle([...fullDeck]);
    // Give each player two cards to start with.
    const hands = [...playersList].map(
      (_) =>
        [
          { card: deck.shift(), flipped: false },
          { card: deck.shift(), flipped: false },
        ] as [CardInHand, CardInHand]
    );
    this.state = {
      players,
      deck,
      hands,
      currTurn: 0,
      currTurnActions: [],
      resolutionActions: [],
      actions: [],
    };
    this.updateActions();
  }

  dumpJson() {
    return JSON.stringify(this.state);
  }

  loadJson(json: string) {
    this.state = JSON.parse(json);
  }

  getState(): State {
    return this.state;
  }

  doAction(player: number, action: Action): void {
    if (action.type !== 'Choose') {
      this.state.currTurnActions.push({ player, action } as PlayerAction);
    } else {
      const lastAction = this.state.currTurnActions.pop();
      if (lastAction.action.type === 'Challenge') {
        this.handleRevealAfterChallenge(player, action, lastAction);
      } else if (lastAction.action.type === 'Revealing Influence') {
        this.handleRevealAfterRevealingInfluence(player, action);
      } else if (lastAction.action.type === 'Exchanging Influence') {
        this.handleRevealAfterExchange(player, action);
      } else {
        assert(false, 'Unexpected lastAction on stack: ' + lastAction.action.type);
      }
    }
    this.updateActions();
  }

  handleRevealAfterChallenge(player: number, choose: ChooseAction, challenge: PlayerAction) {
    assert(choose.cards.length === 1);
    const requiredCard = this.getCardForAction(
      this.state.currTurnActions[this.state.currTurnActions.length - 1].action
    );
    if (choose.cards[0] === requiredCard) {
      this.state.resolutionActions.push({ type: 'Discard', player, card: choose.cards[0] });
      this.state.currTurnActions.push({
        player: challenge.player,
        action: { type: 'Revealing Influence', blockable: false, challengable: false },
      });
    } else {
      const failedAction = this.state.currTurnActions.pop();
      this.state.resolutionActions.push({ type: 'Flip', card: choose.cards[0], player });
      if (this.state.currTurnActions.length > 0) {
        this.resolveAction(this.state.currTurnActions.pop());
      }
    }
  }

  handleRevealAfterRevealingInfluence(player: number, action: ChooseAction) {
    assert(action.cards.length === 1);
    this.state.resolutionActions.push({ type: 'Flip', player, card: action.cards[0] });
    if (this.state.currTurnActions.length > 0) {
      this.resolveAction(this.state.currTurnActions.pop());
    }
  }

  handleRevealAfterExchange(player: number, action: ChooseAction) {
    assert(action.cards.length === 2);
    const cardsToReturn = action.cards;
    cardsToReturn.map((card) => this.state.resolutionActions.push({ type: 'Discard', player, card }));
  }

  updateActions(): void {
    this.state.actions = this.getActions();
  }

  // Resolve the action on top of the stack.
  resolve(): void {
    assert(this.state.currTurnActions.length > 0, 'Expect > 0 actions on stack before resolving');
    this.resolveAction(this.state.currTurnActions.pop());
    this.updateActions();
  }

  // Resolve a given action and generate the resolution actions
  resolveAction({ player, action }: PlayerAction) {
    switch (action.type) {
      case 'Assassinate':
        this.state.currTurnActions.push({
          player: action.target,
          action: { type: 'Revealing Influence', blockable: false, challengable: false },
        });
        break;
      case 'Block':
        const blockedAction = this.state.currTurnActions.pop();
        break;
      case 'Challenge':
        const challengedAction = this.state.currTurnActions.pop();
        break;
      case 'Coup':
        this.state.resolutionActions.push({ type: 'Lose Coins', losingPlayer: player, coins: 7 });
        this.state.currTurnActions.push({
          player: action.target,
          action: { type: 'Revealing Influence', blockable: false, challengable: false },
        });
        break;
      case 'Exchange':
        this.state.resolutionActions.push({ type: 'Draw', player });
        this.state.resolutionActions.push({ type: 'Draw', player });
        this.state.currTurnActions.push({
          player,
          action: { type: 'Exchanging Influence', blockable: false, challengable: false },
        });
        break;
      case 'Foreign Aid':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 2 });
        break;
      case 'Income':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 1 });
        break;
      case 'Steal':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 2 });
        this.state.resolutionActions.push({ type: 'Lose Coins', losingPlayer: action.target, coins: 2 });
        break;
      case 'Tax':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 3 });
        break;
      default:
        assert(false, 'Unhandled action type: ' + action.type);
    }
  }

  getActions(): Array<AvailableActions> {
    return this.state.players.map((_, index) => {
      if (this.state.currTurnActions.length === 0) {
        return this.getEmptyStackActions(index);
      }
      const { player, action } = this.state.currTurnActions[this.state.currTurnActions.length - 1];
      switch (action.type) {
        case 'Assassinate':
        case 'Coup':
        case 'Exchange':
        case 'Foreign Aid':
        case 'Income':
        case 'Steal':
        case 'Tax':
          return this.getActionOnStackActions(index, { player, action });
        case 'Exchanging Influence':
          return this.getExchangingOnStackActions(index, { player, action });
        case 'Block':
          return this.getBlockActionOnStackActions(index, { player, action });
        case 'Challenge':
          return this.getChallengeOnStackActions(index, { player, action });
        case 'Revealing Influence':
          return this.getRevealingInfluenceOnStackActions(index, { player, action });
        default:
          assert(false, 'Unexpected action type on top of stack');
      }
    });
  }

  // Get available actions when there are no actions on the stack.
  getEmptyStackActions(playerIndex: number): AvailableActions {
    if (playerIndex !== this.state.currTurn) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }

    // All players that aren't you are valid targets for actions.
    const targets = this.state.players.filter((p, _) => p.index !== playerIndex).map((p) => p.index);

    const generalActions = [
      { type: 'Income', blockable: false, challengable: false },
      { type: 'Foreign Aid', blockable: true, challengable: false },
      // Add one coup action for each player that is not youself.
      ...targets.map((i) => ({ type: 'Coup', blockable: false, challengable: false, target: i })),
    ] as Array<GeneralAction>;

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

  // Get actions available when the is an action on the stack.
  getActionOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    if (actionOnStack.player === playerIndex) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }

    const generalActions = actionOnStack.action.challengable
      ? ([{ type: 'Challenge', blockable: false, challengable: false }] as Array<ChallengeAction>)
      : [];

    const usableCards = this.state.hands[playerIndex].filter((card) => !card.flipped).map((card) => card.card);
    const characterActions = this.getAvailableBlockActionsForCards(actionOnStack.action, usableCards);

    const cardsPlayerDoesNotHave = this.getCardsPlayerDoesNotHave(playerIndex);
    const bluffActions = this.getAvailableBlockActionsForCards(actionOnStack.action, cardsPlayerDoesNotHave);

    return { generalActions, characterActions, bluffActions };
  }

  getExchangingOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    if (playerIndex !== actionOnStack.player) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }
    const cards = this.state.hands[playerIndex].filter((card) => !card.flipped).map((card) => card.card);
    const deck0 = this.state.deck[0];
    const deck1 = this.state.deck[1];
    cards.push(deck0, deck1);
    const cardCombinations = uniqueCombinations(cards);
    const actions = cardCombinations.map((cards) => ({
      type: 'Choose',
      blockable: false,
      challengable: false,
      cards,
    })) as Array<ChooseAction>;
    const chooseActions = {
      cards,
      actions,
    };
    return { generalActions: [], characterActions: [], bluffActions: [], chooseActions };
  }

  getBlockActionOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    if (playerIndex === actionOnStack.player) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }
    return {
      generalActions: [{ type: 'Challenge', blockable: false, challengable: false }],
      characterActions: [],
      bluffActions: [],
    };
  }

  getChallengeOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    const challengedAction = this.state.currTurnActions[this.state.currTurnActions.length - 2];
    if (challengedAction.player !== playerIndex) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }

    const usableCardsInHand = this.state.hands[playerIndex].filter((card) => !card.flipped).map((card) => card.card);
    const actions = usableCardsInHand.map((card) => ({
      type: 'Choose',
      blockable: false,
      challengable: false,
      cards: [card],
    })) as Array<ChooseAction>;
    const chooseActions = {
      cards: usableCardsInHand,
      actions,
    };
    return { generalActions: [], characterActions: [], bluffActions: [], chooseActions };
  }

  getRevealingInfluenceOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    if (actionOnStack.player !== playerIndex) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }

    const usableCardsInHand = this.state.hands[playerIndex].filter((card) => !card.flipped).map((card) => card.card);
    const actions = usableCardsInHand.map((card) => ({
      type: 'Choose',
      blockable: false,
      challengable: false,
      cards: [card],
    })) as Array<ChooseAction>;
    const chooseActions = {
      cards: usableCardsInHand,
      actions,
    };
    return { generalActions: [], characterActions: [], bluffActions: [], chooseActions };
  }

  getAvailableBlockActionsForCards(actionToBlock: Action, cardsToBlockWith: Array<Card>): Array<BlockAction> {
    return cardsToBlockWith
      .map((card) => this.getBlockActionForCharacter(card, actionToBlock))
      .filter((a) => a != null);
  }

  // Given a card and an action on the stack return a block action if the card is able to block that action.
  getBlockActionForCharacter(card: Card, actionToBlock: Action): BlockAction | null {
    const blockAction = { type: 'Block', blockable: false, challengable: true, card } as BlockAction;
    switch (card) {
      case 'Contessa':
        if (actionToBlock.type === 'Assassinate') {
          return blockAction;
        }
        return null;
      case 'Duke':
        if (actionToBlock.type === 'Foreign Aid') {
          return blockAction;
        }
        return null;
      case 'Captain':
      case 'Ambassador':
        if (actionToBlock.type === 'Steal') {
          return blockAction;
        }
        return null;
      default:
        return null;
    }
  }

  drawCardFromDeck() {
    return this.state.deck.shift();
  }

  getActionForCharacter(character: Card, targets: Array<number>): Array<CharacterAction> {
    switch (character) {
      case 'Captain':
        return targets.map((i) => ({ type: 'Steal', blockable: true, challengable: true, target: i }));
      case 'Duke':
        return [{ type: 'Tax', blockable: false, challengable: true }];
      case 'Ambassador':
        return [{ type: 'Exchange', blockable: false, challengable: true }];
      case 'Assassin':
        return targets.map((i) => ({
          type: 'Assassinate',
          blockable: true,
          challengable: true,
          target: i,
        }));
      case 'Contessa':
      default:
        return [];
    }
  }

  getCardForAction(action: Action): Card {
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
      default:
        assert(false, 'No character mapping for action: ' + action.type);
    }
  }

  getIndexOfUnrevealedCard(playerIndex: number, card: Card) {
    var index = -1;
    for (var i = 0; i < this.state.hands[playerIndex].length; i++) {
      if (this.state.hands[playerIndex][i].card === card && this.state.hands[playerIndex][i].flipped === false) {
        index = i;
        break;
      }
    }
    return index;
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

function flatten<T>(array: Array<Array<T>>): Array<T> {
  return array.reduce((res, curr) => res.concat(...curr), []);
}

function dedupe<T>(array: Array<[T, T]>): Array<[T, T]> {
  return array.filter(
    ([e1, e2], index, self) =>
      index === self.findIndex(([e3, e4]) => (e1 === e3 && e2 === e4) || (e1 === e4 && e2 === e3))
  );
}

// Given an array of things, return an array of each unique combination of the elements. Note: (a,b) == (b,a) for purposes of uniqueness.
function uniqueCombinations<T>(array: Array<T>): Array<[T, T]> {
  const temp = [...array];
  const combinations = temp.reduce((acc, v, i) => acc.concat(temp.slice(i + 1).map((w) => [v, w])), []);
  return dedupe(combinations);
}

function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    const msg = message ? message : 'Failed assertion';
    throw new Error(msg);
  }
}
