import isEqual from 'lodash.isequal';

const allCards: Array<Card> = ['Captain', 'Contessa', 'Duke', 'Assassin', 'Ambassador'];
const fullDeck = allCards.reduce(function (result, curr) {
  return result.concat([curr, curr, curr]);
}, []);

export default class Coup {
  state: State;

  constructor(playersList: Array<{ nickname: string; id: string }>) {
    const players = playersList.map(({ nickname, id }, index) => ({
      index,
      coins: 2,
      deltaCoins: 0,
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
      actionPlayed: false,
      challengeUsable: true,
      actionStack: [],
      actionList: [],
      actions: [],
      waitingOnPlayers: [],
    };
    this.updateActions();
  }

  dumpJson() {
    return JSON.stringify(this.state);
  }

  loadJson(json: string) {
    this.state = JSON.parse(json);
    this.updateActions();
  }

  getState(): State {
    return this.state;
  }

  doAction(player: number, action: Action): void {
    if (!this.isActionLegal(player, action)) {
      console.log('Invalid action');
      throw new Error('Invalid Action');
      return;
    }

    if (action.type !== 'Pass') {
      this.state.actionList.push({ player, action });
    }

    if (action.type !== 'Choose') {
      this.state.actionPlayed = true;
      switch (action.type) {
        case 'Pass':
          this.state.waitingOnPlayers = this.state.waitingOnPlayers.filter((i) => i !== player);
          if (this.state.waitingOnPlayers.length === 0) {
            this.resolve();
            return;
          }
          break;
        case 'Block':
          this.state.challengeUsable = false;
          this.state.actionStack.push({ player, action } as PlayerAction);
          break;
        case 'Challenge':
          this.state.waitingOnPlayers = [];
          this.state.actionStack.push({ player, action } as PlayerAction);
          break;
        default:
          this.state.actionStack.push({ player, action } as PlayerAction);
          break;
      }
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

    const actionOnTopOfStack = this.state.actionStack[this.state.actionStack.length - 1];
    if (
      actionOnTopOfStack &&
      (this.isActionChallengable(actionOnTopOfStack.action) || this.isActionBlockable(actionOnTopOfStack.action)) &&
      action.type !== 'Pass'
    ) {
      this.updateWaitingOnPlayers(actionOnTopOfStack.player, actionOnTopOfStack.action);
    }
    this.updateActions();
  }

  handleRevealAfterChallenge(player: number, choose: ChooseAction, challenge: PlayerAction) {
    assert(choose.cards.length === 1);
    const challengedAction = this.state.actionStack[this.state.actionStack.length - 1].action;
    const requiredCard = this.getCardForAction(challengedAction);
    if (choose.cards[0] === requiredCard) {
      this.executeResolutionAction({ type: 'Return', player, card: choose.cards[0] });
      this.state.actionStack.push({
        player: challenge.player,
        action: { type: 'Revealing Influence', reason: 'Failed Challenge' },
      });
    } else {
      const failedAction = this.state.actionStack.pop();
      this.executeResolutionAction({ type: 'Flip', card: choose.cards[0], player });
      if (challengedAction.type === 'Block') {
        this.resolveAction(this.state.actionStack.pop());
      } else if (this.state.actionStack.length === 2) {
        this.state.challengeUsable = false;
      }
    }
  }

  handleRevealAfterRevealingInfluence(player: number, action: ChooseAction) {
    assert(action.cards.length === 1);
    this.executeResolutionAction({ type: 'Flip', player, card: action.cards[0] });
    if (this.state.actionStack.length > 0 && !this.state.challengeUsable) {
      this.resolveAction(this.state.actionStack.pop());
    } else if (this.state.actionStack.length > 0) {
      this.state.challengeUsable = false;
    }
  }

  handleRevealAfterExchange(player: number, action: ChooseAction) {
    assert(action.cards.length === 2);
    const cardsToReturn = [...action.cards];
    cardsToReturn.map((card) => this.executeResolutionAction({ type: 'Discard', player, card }));
  }

  updateActions(): void {
    if (this.state.actionStack.length === 0 && this.state.actionPlayed) {
      this.state.actionStack.push({
        player: this.state.currTurn,
        action: { type: 'Resolving' },
      });
    }
    this.state.actions = this.getActions();
  }

  updateWaitingOnPlayers(player: number, action: Action): void {
    const playersThatCanPass = this.state.players
      .map((_, index) => {
        if (this.state.players[index].eliminated) {
          return;
        }

        if (player === index) {
          return;
        }

        const blockable = this.isActionBlockable(action);
        if (!this.state.challengeUsable && action.type !== 'Block' && !blockable) {
          return;
        }

        // If the action is targetting one player only that player can pass
        const isTargettedAction = this.isTargettedAction(action);
        if (isTargettedAction && (action as StealAction).target != index) {
          return;
        }

        const usableCards = this.state.hands[player].filter((card) => !card.flipped).map((card) => card.card);
        const hasRequiredCardToBlock = this.getAvailableBlockActionsForCards(action, usableCards).length > 0;
        // Can't pass if the action needs to be blocked but player does not have the required cards
        // if (!challengable && blockable && !hasRequiredCardToBlock) {
        //   return;
        // }

        return index;
      })
      .filter((i) => i !== undefined);
    this.state.waitingOnPlayers = playersThatCanPass;
  }

  executeResolutionAction(action: ResolutionAction) {
    const { type } = action;
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
      case 'Return': {
        const { player, card } = action;
        const index = this.state.hands[player].findIndex(
          (cardInHand) => !cardInHand.flipped && cardInHand.card === card && !cardInHand.replacing
        );
        assert(index !== -1, `Can't remove card ${card} from hand ${JSON.stringify(this.state.hands[player])}`);
        this.state.hands[player][index].replacing = true;
        break;
      }
      case 'Draw': {
        assert(this.state.deck.length > 0);
        const [card] = this.state.deck.splice(0, 1);
        const { player } = action;
        this.state.hands[player].push({ card, flipped: false, replacing: false });
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
        this.state.players[gainingPlayer].deltaCoins = coins;
        break;
      }
      case 'Lose Coins': {
        const { losingPlayer, coins } = action;
        this.state.players[losingPlayer].deltaCoins = -coins;
        break;
      }
      default:
        assert(false, 'Unhandled action type: ' + type);
    }
  }

  executeResolutionActions() {
    this.state.actionList = [];
    this.state.actionPlayed = false;
    this.state.challengeUsable = true;
    const winner = this.checkForWinner();
    if (winner === null) {
      // If any player has cards that were revealed and need to be replaced do that now before the turn is over
      for (let i = 0; i < this.state.players.length; i++) {
        const cardIndexTooReplace = this.state.hands[i].findIndex((card) => card.replacing);
        if (cardIndexTooReplace !== -1) {
          const card = this.drawCardFromDeck();
          this.state.deck.push(this.state.hands[i][cardIndexTooReplace].card);
          this.state.hands[i].splice(cardIndexTooReplace, 1);
          this.state.hands[i].push({ card, flipped: false, replacing: false });
          this.state.deck = shuffle([...this.state.deck]);
        }
        this.state.players[i].coins += this.state.players[i].deltaCoins;
        this.state.players[i].deltaCoins = 0;
      }
      this.updateCurrTurn();
    } else {
      // We have a winner
      this.state.actionStack.push({
        player: winner,
        action: { type: 'Declare Winner' },
      });
      this.state.actionList.push({
        player: winner,
        action: { type: 'Declare Winner' },
      });
      // Apply coin changes right away
      for (let i = 0; i < this.state.players.length; i++) {
        this.state.players[i].coins += this.state.players[i].deltaCoins;
        this.state.players[i].deltaCoins = 0;
      }
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
        this.executeResolutionAction({ type: 'Lose Coins', losingPlayer: player, coins: 3 });
        this.state.actionStack.push({
          player: action.target,
          action: { type: 'Revealing Influence', reason: 'Assassination' },
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
        this.executeResolutionAction({ type: 'Lose Coins', losingPlayer: player, coins: 7 });
        this.state.actionStack.push({
          player: action.target,
          action: { type: 'Revealing Influence', reason: 'Coup' },
        });
        break;
      case 'Exchange':
        this.executeResolutionAction({ type: 'Draw', player });
        this.executeResolutionAction({ type: 'Draw', player });
        this.state.actionStack.push({
          player,
          action: { type: 'Exchanging Influence' },
        });
        break;
      case 'Foreign Aid':
        this.executeResolutionAction({ type: 'Gain Coins', gainingPlayer: player, coins: 2 });
        break;
      case 'Income':
        this.executeResolutionAction({ type: 'Gain Coins', gainingPlayer: player, coins: 1 });
        break;
      case 'Steal':
        const coins = Math.min(2, this.state.players[action.target].coins);
        this.executeResolutionAction({ type: 'Lose Coins', losingPlayer: action.target, coins });
        this.executeResolutionAction({ type: 'Gain Coins', gainingPlayer: player, coins });
        break;
      case 'Tax':
        this.executeResolutionAction({ type: 'Gain Coins', gainingPlayer: player, coins: 3 });
        break;
      case 'Resolving':
        this.executeResolutionActions();
        break;
      case 'Declare Winner':
      case 'Revealing Influence':
        break;
      default:
        assert(false, 'Unhandled action type: ' + action.type);
    }
  }

  getActions(): Array<AvailableActions> {
    return this.state.players.map((_, index) => {
      if (this.state.players[index].eliminated || this.isGameOver()) {
        return { generalActions: [], characterActions: [], bluffActions: [] };
      }
      if (this.state.actionStack.length === 0) {
        return this.getEmptyStackActions(index);
      }
      // Get action on top of stack
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
    const targets = this.state.players.filter((p, _) => p.index !== playerIndex && !p.eliminated).map((p) => p.index);

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
        .map((card) => this.getActionForCharacter(playerIndex, card.card, targets))
    ).filter(isNotDupllicate);

    // bluffActions for player
    const bluffActions = flatten(
      this.getCardsPlayerDoesNotHave(playerIndex).map((card) => this.getActionForCharacter(playerIndex, card, targets))
    ).filter(isNotDupllicate);

    return { generalActions, characterActions, bluffActions };
  }

  // Get actions available when the is an action on the stack.
  getActionOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    const action = actionOnStack.action;
    const waitingOnPlayer = this.state.waitingOnPlayers.includes(playerIndex);
    const isTargetedAction = this.isTargettedAction(action);
    const isTargetOfAction = (action as StealAction).target === playerIndex;
    if (actionOnStack.player === playerIndex || !waitingOnPlayer || (isTargetedAction && !isTargetOfAction)) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }

    const challengable = this.isActionChallengable(actionOnStack.action);
    const challengeUsable = this.state.challengeUsable;
    const generalActions: Array<ChallengeAction | PassAction> = [];
    if (waitingOnPlayer) {
      generalActions.push({ type: 'Pass' });
      if (challengeUsable && challengable) {
        generalActions.push({ type: 'Challenge' });
      }
    }

    const usableCards = this.state.hands[playerIndex].filter((card) => !card.flipped).map((card) => card.card);
    const characterActions = this.getAvailableBlockActionsForCards(actionOnStack.action, usableCards).filter(
      isNotDupllicate
    );

    const cardsPlayerDoesNotHave = this.getCardsPlayerDoesNotHave(playerIndex);
    const bluffActions = this.getAvailableBlockActionsForCards(actionOnStack.action, cardsPlayerDoesNotHave).filter(
      isNotDupllicate
    );

    return { generalActions, characterActions, bluffActions };
  }

  getExchangingOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    if (playerIndex !== actionOnStack.player) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }
    const cards = this.state.hands[playerIndex]
      .filter((card) => !card.flipped && !card.replacing)
      .map((card) => card.card);
    const cardCombinations = uniqueCombinations(cards);
    const actions = cardCombinations.map((cards) => ({
      type: 'Choose',
      cards,
      reason: 'Exchange',
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
    const generalActions = this.state.waitingOnPlayers.includes(playerIndex)
      ? ([{ type: 'Challenge' }, { type: 'Pass' }] as Array<ChallengeAction | PassAction>)
      : [];
    return {
      generalActions,
      characterActions: [],
      bluffActions: [],
    };
  }

  getChallengeOnStackActions(playerIndex: number, actionOnStack: PlayerAction): AvailableActions {
    const challengedAction = this.state.actionStack[this.state.actionStack.length - 2];
    if (challengedAction.player !== playerIndex) {
      return { generalActions: [], characterActions: [], bluffActions: [] };
    }

    const requiredCard = this.getCardForAction(challengedAction.action);
    const usableCardsInHand = this.state.hands[playerIndex].filter((card) => !card.flipped).map((card) => card.card);
    const actions: Array<ChooseAction> = usableCardsInHand
      .map((card) => ({
        type: 'Choose',
        cards: [card],
        reason: card === requiredCard ? 'Beaten Challenge' : 'Failed Bluff',
      }))
      .filter(isNotDupllicate) as Array<ChooseAction>;
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

    const action = actionOnStack.action;
    assert(action.type === 'Revealing Influence');

    const usableCardsInHand = this.state.hands[playerIndex]
      .filter((card) => !card.flipped && !card.replacing)
      .map((card) => card.card);
    const actions = usableCardsInHand
      .map((card) => ({
        type: 'Choose',
        cards: [card],
        reason: action.reason,
      }))
      .filter(isNotDupllicate) as Array<ChooseAction>;
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
    const blockAction = { type: 'Block', card } as BlockAction;
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

  getActionForCharacter(playerIndex: number, character: Card, targets: Array<number>): Array<CharacterAction> {
    switch (character) {
      case 'Captain':
        return targets.map((i) => ({ type: 'Steal', target: i }));
      case 'Duke':
        return [{ type: 'Tax' }];
      case 'Ambassador':
        return [{ type: 'Exchange' }];
      case 'Assassin':
        const disabled = this.state.players[playerIndex].coins < 3;
        return targets.map((i) => ({
          type: 'Assassinate',
          target: i,
          disabled,
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
      case 'Block':
        return true;
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

  isTargettedAction(action: Action): action is StealAction | AssassinateAction {
    return ['Steal', 'Assassinate'].includes(action.type);
  }

  isActionLegal(player: number, action: Action): boolean {
    if (action.type === 'Assassinate' && action.disabled) {
      return false;
    }
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

  checkForWinner(): number | null {
    const uneliminatedPlayers = this.state.players.filter((player) => !player.eliminated);
    assert(uneliminatedPlayers.length != 0);
    if (uneliminatedPlayers.length === 1) {
      return uneliminatedPlayers[0].index;
    }
    return null;
  }

  isGameOver(): boolean {
    return this.checkForWinner() !== null;
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

function dedupePairsArray<T>(array: Array<[T, T]>): Array<[T, T]> {
  return array.filter(
    ([e1, e2], index, self) =>
      index === self.findIndex(([e3, e4]) => (e1 === e3 && e2 === e4) || (e1 === e4 && e2 === e3))
  );
}

// Given an array of things, return an array of each unique combination of the elements. Note: (a,b) == (b,a) for purposes of uniqueness.
function uniqueCombinations<T>(array: Array<T>): Array<[T, T]> {
  const temp = [...array];
  const combinations = temp.reduce((acc, v, i) => acc.concat(temp.slice(i + 1).map((w) => [v, w])), []);
  return dedupePairsArray(combinations);
}

function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    const msg = message ? message : 'Failed assertion';
    throw new Error(msg);
  }
}

function isNotDupllicate<T>(thing: T, index: number, array: Array<T>): thing is T {
  return array.findIndex((a) => JSON.stringify(a) === JSON.stringify(thing)) === index;
}
