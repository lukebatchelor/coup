import isEqual from 'lodash.isequal';

type Player = { index: number; coins: number; nickname: string; id: string; eliminated: boolean };

type State = {
  players: Array<Player>;
  deck: Array<Card>;
  hands: Array<[CardInHand, CardInHand]>;
  currTurn: number;
  actionStack: Array<PlayerAction>;
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

type Flip = { type: 'Flip'; player: number; card: Card };
type ResolutionAction =
  | { type: 'Gain Coins'; gainingPlayer: number; coins: number }
  | { type: 'Lose Coins'; losingPlayer: number; coins: number }
  | Flip
  | { type: 'Draw'; player: number }
  | { type: 'Discard'; player: number; card: Card };

// General Actions
type IncomeAction = { type: 'Income' };
type ForeinAidAction = { type: 'Foreign Aid' };
type CoupAction = { type: 'Coup'; target: number };
type ChallengeAction = { type: 'Challenge' };
type RevealAction = { type: 'Reveal'; card: Card };

// Character/Bluff Actions
type TaxAction = { type: 'Tax' };
type AssassinateAction = { type: 'Assassinate'; target: number };
type ExchangeAction = { type: 'Exchange' };
type StealAction = { type: 'Steal'; target: number };
type BlockAction = { type: 'Block'; card: Card };

// Other actions that can be on the stack but are not put there by players.
type RevealingInfluence = { type: 'Revealing Influence' };
type Exchanging = { type: 'Exchanging Influence' };
type Resolving = { type: 'Resolving' };
type DeclareWinner = { type: 'Declare Winner' };
type OtherAction = RevealingInfluence | Exchanging | Resolving | DeclareWinner;

// ChooseAction - used after assassinate/coup/challenge/exchange
type ChooseAction = { type: 'Choose'; cards: Array<Card> };

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
      eliminated: false,
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
      actionStack: [],
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
    if (!this.isActionLegal(player, action)) {
      console.log('Invalid action');
      return;
    }
    if (action.type !== 'Choose') {
      this.state.actionStack.push({ player, action } as PlayerAction);
    } else {
      const lastAction = this.state.actionStack.pop();
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
    const requiredCard = this.getCardForAction(this.state.actionStack[this.state.actionStack.length - 1].action);
    if (choose.cards[0] === requiredCard) {
      this.state.resolutionActions.push({ type: 'Discard', player, card: choose.cards[0] });
      this.state.resolutionActions.push({ type: 'Draw', player });
      this.state.actionStack.push({
        player: challenge.player,
        action: { type: 'Revealing Influence' },
      });
    } else {
      const failedAction = this.state.actionStack.pop();
      this.state.resolutionActions.push({ type: 'Flip', card: choose.cards[0], player });
      if (this.state.actionStack.length > 0) {
        this.resolveAction(this.state.actionStack.pop());
      }
    }
  }

  handleRevealAfterRevealingInfluence(player: number, action: ChooseAction) {
    assert(action.cards.length === 1);
    this.state.resolutionActions.push({ type: 'Flip', player, card: action.cards[0] });
    if (this.state.actionStack.length > 0) {
      this.resolveAction(this.state.actionStack.pop());
    }
  }

  handleRevealAfterExchange(player: number, action: ChooseAction) {
    assert(action.cards.length === 2);
    const cardsToReturn = action.cards;
    cardsToReturn.map((card) => this.state.resolutionActions.push({ type: 'Discard', player, card }));
  }

  updateActions(): void {
    if (this.state.actionStack.length === 0 && this.state.resolutionActions.length > 0) {
      this.state.actionStack.push({
        player: this.state.currTurn,
        action: { type: 'Resolving' },
      });
    }
    this.state.actions = this.getActions();
  }

  executeResolutionActions() {
    for (var action of this.state.resolutionActions) {
      const { type } = action;
      console.log('Executing resolution action :' + JSON.stringify(action));
      switch (action.type) {
        case 'Discard': {
          const { player, card } = action;
          const index = this.state.hands[player].findIndex(
            (cardInHand) => !cardInHand.flipped && cardInHand.card === card
          );
          assert(index !== -1, `Can't remove card ${card} from hand ${JSON.stringify(this.state.hands[player])}`);
          this.state.hands[player].splice(index, 1);
          break;
        }
        case 'Draw': {
          assert(this.state.deck.length > 0);
          const [card] = this.state.deck.splice(0, 1);
          const { player } = action;
          this.state.hands[player].push({ card, flipped: false });
          break;
        }
        case 'Flip': {
          const { player, card } = action;
          const index = this.state.hands[player].findIndex(
            (cardInHand) => !cardInHand.flipped && cardInHand.card === card
          );
          assert(index !== -1, `Can't flip card ${card} in hand ${JSON.stringify(this.state.hands[player])}`);
          this.state.hands[player][index].flipped = true;
          const eliminated = this.state.hands[player].every((card) => card.flipped);
          this.state.players[player].eliminated = eliminated;
          break;
        }
        case 'Gain Coins': {
          const { gainingPlayer, coins } = action;
          this.state.players[gainingPlayer].coins += coins;
          break;
        }
        case 'Lose Coins': {
          const { losingPlayer, coins } = action;
          this.state.players[losingPlayer].coins -= coins;
          break;
        }
        default:
          assert(false, 'Unhandled action type: ' + type);
      }
    }
    this.state.resolutionActions = [];
    const gameOver = this.checkForWinner();
    if (!gameOver) {
      this.updateCurrTurn();
    }
  }

  // Resolve the action on top of the stack.
  resolve(): void {
    assert(this.state.actionStack.length > 0, 'Expect > 0 actions on stack before resolving');
    this.resolveAction(this.state.actionStack.pop());
    this.updateActions();
  }

  // Resolve a given action and generate the resolution actions
  resolveAction({ player, action }: PlayerAction) {
    switch (action.type) {
      case 'Assassinate':
        this.state.actionStack.push({
          player: action.target,
          action: { type: 'Revealing Influence' },
        });
        break;
      case 'Block':
        const blockedAction = this.state.actionStack.pop();
        this.state.actionStack.push({
          player: this.state.currTurn,
          action: { type: 'Resolving' },
        });
        break;
      case 'Challenge':
        const challengedAction = this.state.actionStack.pop();
        if (this.state.actionStack.length === 0) {
          this.state.actionStack.push({
            player: this.state.currTurn,
            action: { type: 'Resolving' },
          });
        }
        break;
      case 'Coup':
        this.state.resolutionActions.push({ type: 'Lose Coins', losingPlayer: player, coins: 7 });
        this.state.actionStack.push({
          player: action.target,
          action: { type: 'Revealing Influence' },
        });
        break;
      case 'Exchange':
        this.state.resolutionActions.push({ type: 'Draw', player });
        this.state.resolutionActions.push({ type: 'Draw', player });
        this.state.actionStack.push({
          player,
          action: { type: 'Exchanging Influence' },
        });
        break;
      case 'Foreign Aid':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 2 });
        break;
      case 'Income':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 1 });
        break;
      case 'Steal':
        const coins = Math.min(2, this.state.players[action.target].coins);
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 2 });
        this.state.resolutionActions.push({ type: 'Lose Coins', losingPlayer: action.target, coins: 2 });
        break;
      case 'Tax':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 3 });
        break;
      case 'Resolving':
        this.executeResolutionActions();
        break;
      case 'Declare Winner':
        break;
      default:
        assert(false, 'Unhandled action type: ' + action.type);
    }
  }

  getActions(): Array<AvailableActions> {
    return this.state.players.map((_, index) => {
      if (this.state.actionStack.length === 0) {
        return this.getEmptyStackActions(index);
      }
      const { player, action } = this.state.actionStack[this.state.actionStack.length - 1];
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
        case 'Resolving':
          return { generalActions: [], characterActions: [], bluffActions: [] };
        case 'Declare Winner':
          return { generalActions: [], characterActions: [], bluffActions: [] };
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

    if (this.state.players[playerIndex].coins > 9) {
      // Player _has_ to play a coup.
      const coupActions = targets.map((i) => ({ type: 'Coup', target: i }));
      return { generalActions: coupActions as Array<GeneralAction>, characterActions: [], bluffActions: [] };
    }

    const generalActions = [{ type: 'Income' }, { type: 'Foreign Aid' }] as Array<GeneralAction>;

    // Add coup actions if player has enough coins.
    if (this.state.players[playerIndex].coins > 6) {
      const coupActions = targets.map((i) => ({ type: 'Coup', target: i }));
      generalActions.push(...(coupActions as Array<GeneralAction>));
    }

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

    const generalActions = this.isActionChallengable(actionOnStack.action)
      ? ([{ type: 'Challenge' }] as Array<ChallengeAction>)
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
      generalActions: [{ type: 'Challenge' }],
      characterActions: [],
      bluffActions: [],
    };
  }

  getChallengeOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    const challengedAction = this.state.actionStack[this.state.actionStack.length - 2];
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

    // Need to check if the player has any unresolved flips in the resolution queue.
    const flippedCardsInResolutionActions = this.state.resolutionActions
      .filter((a) => a.type === 'Flip' && a.player === playerIndex)
      .map((a) => (a as Flip).card);
    assert(flippedCardsInResolutionActions.length < 2);
    if (flippedCardsInResolutionActions.length === 1) {
      usableCardsInHand.splice(usableCardsInHand.indexOf(flippedCardsInResolutionActions[0]), 1);
    }

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
        return [{ type: 'Tax' }];
      case 'Ambassador':
        return [{ type: 'Exchange' }];
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
    const playersCards = this.state.hands[playerIndex].filter((card) => !card.flipped).map((card) => card.card);
    return allCards.filter((card) => !playersCards.includes(card));
  }

  isActionBlockable(action: Action) {
    switch (action.type) {
      case 'Assassinate':
      case 'Foreign Aid':
      case 'Steal':
        return true;
      case 'Block':
      case 'Challenge':
      case 'Choose':
      case 'Coup':
      case 'Declare Winner':
      case 'Exchange':
      case 'Exchanging Influence':
      case 'Income':
      case 'Resolving':
      case 'Reveal':
      case 'Revealing Influence':
      case 'Tax':
        return false;
    }
  }

  isActionChallengable(action: Action) {
    switch (action.type) {
      case 'Assassinate':
      case 'Exchange':
      case 'Steal':
      case 'Tax':
        return true;
      case 'Block':
      case 'Challenge':
      case 'Choose':
      case 'Coup':
      case 'Declare Winner':
      case 'Exchanging Influence':
      case 'Foreign Aid':
      case 'Income':
      case 'Resolving':
      case 'Reveal':
      case 'Revealing Influence':
        return false;
    }
  }

  isActionLegal(player: number, action: Action): boolean {
    const allAvailableActions = [] as Array<Action>;
    const availableActions = this.state.actions[player];
    allAvailableActions.push(...availableActions.generalActions);
    allAvailableActions.push(...availableActions.characterActions);
    allAvailableActions.push(...availableActions.bluffActions);
    if (availableActions.chooseActions) {
      allAvailableActions.push(...availableActions.chooseActions.actions);
    }
    const valid = allAvailableActions.some((a) => isEqual(a, action));
    if (!valid) {
      console.log(JSON.stringify(allAvailableActions) + ' does not include' + JSON.stringify(action));
    }
    return valid;
  }

  checkForWinner(): boolean {
    const uneliminatedPlayers = this.state.players.filter((player) => !player.eliminated);
    assert(uneliminatedPlayers.length != 0);
    if (uneliminatedPlayers.length === 1) {
      // We have a winner
      this.state.actionStack.push({
        player: uneliminatedPlayers[0].index,
        action: { type: 'Declare Winner' },
      });
      return true;
    }
    return false;
  }

  updateCurrTurn() {
    for (var i = 1; i < this.state.players.length; i++) {
      const j = (this.state.currTurn + i) % this.state.players.length;
      if (!this.state.players[j].eliminated) {
        this.state.currTurn = j;
        return;
      }
    }
    assert(false, `Couldn't find uneliminated player`);
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
