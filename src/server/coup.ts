import { assert } from 'console';

type Player = { index: number; coins: number; nickname: string; id: string };
type Phase =
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
type State = {
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
type Card = 'Captain' | 'Contessa' | 'Duke' | 'Assassin' | 'Ambassador';
type CardInHand = { card: Card; flipped: boolean };
const allCards: Array<Card> = ['Captain', 'Contessa', 'Duke', 'Assassin', 'Ambassador'];
const fullDeck = allCards.reduce(function (result, curr) {
  return result.concat([curr, curr, curr]);
}, []);

// Actions
type ChallengeAction = { type: 'Challenge'; blockable: false; challengable: false };
type BlockAction = { type: 'Block'; blockable: false; challengable: true; card: Card };
type RevealAction = { type: 'Reveal'; blockable: false; challengable: false; card: Card };
type DiscardAction = { type: 'Discard'; blockable: false; challengable: false; card: Card };

type ResolutionAction =
  | { type: 'Gain Coins'; gainingPlayer: number; coins: number }
  | { type: 'Lose Coins'; losingPlayer: number; coins: number }
  | { type: 'Steal'; gainingPlayer: number; losingPlayer: number; coins: number }
  | { type: 'Reveal'; player: number; card: Card }
  | { type: 'Exchange'; player: number; numberOfCards: number }
  | { type: 'Blocked'; blockingPlayer: number };

type Action =
  | { type: 'Income'; blockable: false; challengable: false }
  | { type: 'Foreign Aid'; blockable: true; challengable: false }
  | { type: 'Coup'; blockable: false; challengable: false; target: number }
  | { type: 'Tax'; blockable: false; challengable: true }
  | { type: 'Assassinate'; blockable: true; challengable: true; target: number }
  | { type: 'Exchange'; blockable: false; challengable: true }
  | { type: 'Steal'; blockable: true; challengable: true; target: number }
  | ChallengeAction
  | BlockAction
  | RevealAction
  | DiscardAction;

type PlayerAction = { player: number; action: Action };

type ActionPhaseActions = {
  generalActions: Array<Action>;
  characterActions: Array<Action>;
  bluffActions: Array<Action>;
};
type ActionPlayedPhaseActions = {
  challengeActions: Array<ChallengeAction>;
  blockActions: Array<BlockAction>;
  bluffBlockActions: Array<BlockAction>;
};
type BlockedActionPhaseActions = {
  challengeActions: Array<ChallengeAction>;
};

type ChallengedActionPhaseActions = {
  revealActions: Array<RevealAction>;
};

type ChallengedBlockActionPhaseActions = {
  revealActions: Array<RevealAction>;
};

type ChallengedActionFailedPhaseActions = {
  revealActions: Array<RevealAction>;
};

type ChallengedActionSucceededPhaseActions = {
  revealActions: Array<RevealAction>;
};

type PreResolvingActions = { revealActions: Array<RevealAction> } | { discardActions: Array<DiscardAction> };

type PlayableActions =
  | ActionPhaseActions
  | ActionPlayedPhaseActions
  | BlockedActionPhaseActions
  | ChallengedActionPhaseActions
  | ChallengedBlockActionPhaseActions
  | ChallengedActionFailedPhaseActions
  | ChallengedActionSucceededPhaseActions
  | PreResolvingActions;

export default class Coup {
  state: State;

  constructor({ numberPlayers }: { numberPlayers: number }) {
    const players = [...Array(numberPlayers).keys()].map((index) => ({
      index,
      coins: 2,
      nickname: `${index}`,
      id: `id${index}`,
    }));
    const deck = shuffle([...fullDeck]);
    // Give each player two cards to start with.
    const hands = [...Array(numberPlayers).keys()].map(
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
      phase: 'Action',
      actions: this.getActions(),
    };
  }

  getState(): State {
    return this.state;
  }

  doAction(player: number, action: Action): void {
    const phase = this.state.phase;
    this.state.currTurnActions.push({ player, action });
    if (phase === 'Action') {
      this.state.phase = 'Action_Played';
    } else if (phase === 'Action_Played') {
      if (action.type === 'Block') {
        this.state.phase = 'Blocked_Action';
      } else if (action.type === 'Challenge') {
        this.state.phase = 'Challenged_Action';
      } else {
        assert(false, 'Unexpected action in Action_Played phase: ' + action.type);
      }
    } else if (phase === 'Blocked_Action') {
      assert(action.type === 'Challenge');
      this.state.phase = 'Challenged_Block_Action';
    } else if (phase === 'Challenged_Action') {
      assert(action.type === 'Reveal');
      this.state.phase = this.getStateAfterChallenge();
      this.resolveAction();
    } else if (phase === 'Challenged_Block_Action') {
      assert(action.type === 'Reveal');
      this.state.phase = this.getStateAfterChallenge();
      this.resolveAction();
    } else if (phase === 'Pre_Resolving') {
      assert(action.type === 'Reveal');
      // Phase change happens during resolution
      this.resolveAction();
    }
    this.updateActions();
  }

  updateActions(): void {
    this.state.actions = this.getActions();
  }

  getStateAfterChallenge() {
    assert(this.state.currTurnActions[this.state.currTurnActions.length - 1].action.type === 'Reveal');
    const revealAction = this.state.currTurnActions[this.state.currTurnActions.length - 1];
    assert(revealAction.action.type === 'Challenge');
    const challengeAction = this.state.currTurnActions[this.state.currTurnActions.length - 2];
    assert(challengeAction.action.type === 'Challenge');
    const challengedAction = this.state.currTurnActions[this.state.currTurnActions.length - 3];
    const requiredCard = this.getCardForAction(challengedAction.action);
    if (this.state.phase === 'Challenged_Action') {
      if ((revealAction.action as RevealAction).card === requiredCard) {
        return 'Challenged_Action_Failed';
      } else {
        return 'Challenged_Action_Succeeded';
      }
    } else if (this.state.phase === 'Challenged_Block_Action') {
      if ((revealAction.action as RevealAction).card === requiredCard) {
        return 'Challenged_Block_Action_Failed';
      } else {
        return 'Challenged_Block_Action_Succeeded';
      }
    } else {
      assert(false, 'Invalid phase: ' + this.state.phase);
    }
  }

  // Resolve the current action and generate the resolution actions
  resolveAction() {
    assert(this.state.currTurnActions.length > 0);
    const actionStackSize = this.state.currTurnActions.length;
    const actionOnTopOfStack = this.state.currTurnActions[actionStackSize - 1];
    const phase = this.state.phase;
    if (phase === 'Action') {
      assert(false, 'Should never call resolve action while in Action phase');
    } else if (phase === 'Action_Played') {
      this.resolveActionPlayedPhaseAction(actionOnTopOfStack); // Steal, Tax, Income, Assassinate etc action
    } else if (phase === 'Blocked_Action') {
      this.resolveBlockedActionPhaseAction(actionOnTopOfStack); // Challenged_Block
    } else if (phase === 'Pre_Resolving') {
      this.resolvePreResolvingPhaseAction(actionOnTopOfStack); // Reveal
    } else if (phase === 'Challenged_Action_Failed') {
      // Someone challenged an ACTION phase action and was wrong. They now loses a revealed card.
      this.resolveChallengedActionFailedPhaseAction(actionOnTopOfStack);
    } else if (phase === 'Challenged_Action_Succeeded') {
      // Someone challenged an ACTION phase action and was right. Original player now loses a revealed card.
      this.resolveChallengedActionFailedPhaseAction(actionOnTopOfStack);
    } else if (phase === 'Challenged_Block_Action_Failed') {
      // Someone challenged an BLOCKED_ACTION phase action and was wrong. They now loses a revealed card.
      this.resolveChallengedBlockedActionFailedPhaseAction(actionOnTopOfStack);
    } else if (phase === 'Challenged_Block_Action_Succeeded') {
      // Someone challenged an BLOCKED_ACTION phase action and was right. Blocking player now loses a revealed card.
      this.resolveChallengedBlockedActionFailedPhaseAction(actionOnTopOfStack);
    } else {
      assert(false, 'No mapping to resolve action in phase: ' + phase);
    }
  }

  getActions(): Array<PlayableActions> {
    const phase = this.state.phase;
    return this.state.players.map((_, index) => {
      if (this.state.phase === 'Action') {
        return this.getActionPhaseActions(index);
      } else if (phase === 'Action_Played') {
        return this.getActionPlayedPhaseActions(index);
      } else if (phase === 'Blocked_Action') {
        return this.getBlockedActionPhaseActions(index);
      } else if (phase === 'Challenged_Action') {
        return this.getChallengedActionPhaseActions(index);
      } else if (phase === 'Challenged_Block_Action') {
        return this.getChallengedBlockActionPhaseActions(index);
      } else if (phase === 'Challenged_Action_Failed') {
        return this.getChallengedActionFailedPhaseActions(index);
      } else if (phase === 'Pre_Resolving') {
        return this.getPreResolvingActions(index);
      }
    });
  }

  // Get actions available to a given player in the ACTION phase
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

  // Get actions available to a player in the ACTION_PLAYED phase
  getActionPlayedPhaseActions(playerIndex: number): ActionPlayedPhaseActions {
    const actionOnStack = this.state.currTurnActions[0].action;
    // No actions available if it's your turn.
    if (this.state.currTurn === playerIndex) {
      return { challengeActions: [], blockActions: [], bluffBlockActions: [] };
    }
    const challengeActions = actionOnStack.challengable
      ? ([{ type: 'Challenge', blockable: false, challengable: false }] as Array<ChallengeAction>)
      : [];

    const usableCards = this.state.hands[playerIndex].filter((card) => !card.flipped).map((card) => card.card);
    const blockActions = this.getAvailableBlockActionsForCards(actionOnStack, usableCards);

    const cardsPlayerDoesNotHave = this.getCardsPlayerDoesNotHave(playerIndex);
    const bluffBlockActions = this.getAvailableBlockActionsForCards(actionOnStack, cardsPlayerDoesNotHave);

    return { challengeActions, blockActions, bluffBlockActions };
  }

  // Get actions available to a player in the BLOCKED_ACTION phase.
  getBlockedActionPhaseActions(playerIndex: number): BlockedActionPhaseActions {
    const blockedAction = this.state.currTurnActions[0];
    assert(blockedAction.action.blockable);
    if (playerIndex === blockedAction.player) {
      // Can't challenge your own block.
      return { challengeActions: [] };
    }
    return { challengeActions: [{ type: 'Challenge', blockable: false, challengable: false }] };
  }

  // Get action available to a player in the CHALLENGED_ACTION phase.
  getChallengedActionPhaseActions(playerIndex: number): ChallengedActionPhaseActions {
    const challengedAction = this.state.currTurnActions[0];
    assert(challengedAction.action.challengable);
    // Only the player who was challenged can respond.
    if (challengedAction.player !== playerIndex) {
      return { revealActions: [] };
    }
    const revealActions = this.state.hands[playerIndex]
      .filter((card) => !card.flipped)
      .map((card) => card.card)
      .map((card) => ({ type: 'Reveal', blockable: false, challengable: false, card })) as Array<RevealAction>;
    return { revealActions };
  }

  getChallengedBlockActionPhaseActions(playerIndex: number): ChallengedBlockActionPhaseActions {
    const challengedBlockAction = this.state.currTurnActions[1];
    assert(challengedBlockAction.action.type === 'Block');
    if (challengedBlockAction.player !== playerIndex) {
      return { revealActions: [] };
    }
    const revealActions = this.state.hands[playerIndex]
      .filter((card) => !card.flipped)
      .map((card) => card.card)
      .map((card) => ({ type: 'Reveal', blockable: false, challengable: false, card })) as Array<RevealAction>;
    return { revealActions };
  }

  // Player challenged another players ACTION phase action and was wrong. They now loses a card.
  getChallengedActionFailedPhaseActions(playerIndex: number): ChallengedActionFailedPhaseActions {
    const challengeAction = this.state.currTurnActions[this.state.currTurnActions.length - 2];
    if (playerIndex !== challengeAction.player) {
      return { revealActions: [] };
    }
    const revealActions = this.state.hands[playerIndex]
      .filter((card) => !card.flipped)
      .map((card) => card.card)
      .map((card) => ({ type: 'Reveal', blockable: false, challengable: false, card })) as Array<RevealAction>;
    return { revealActions };
  }

  // Player challenged another players ACTION phase action and was right. Player now loses a card.
  getChallengedActionSucceededPhaseActions(playerIndex: number): ChallengedActionSucceededPhaseActions {
    const challengedAction = this.state.currTurnActions[this.state.currTurnActions.length - 3];
    if (playerIndex !== challengedAction.player) {
      return { revealActions: [] };
    }
    const revealActions = this.state.hands[playerIndex]
      .filter((card) => !card.flipped)
      .map((card) => card.card)
      .map((card) => ({ type: 'Reveal', blockable: false, challengable: false, card })) as Array<RevealAction>;
    return { revealActions };
  }

  getPreResolvingActions(playerIndex: number): PreResolvingActions {
    const resolvingAction = this.state.currTurnActions[0];
    if (
      (resolvingAction.action.type === 'Assassinate' || resolvingAction.action.type === 'Coup') &&
      playerIndex === resolvingAction.action.target
    ) {
      const revealActions = this.state.hands[resolvingAction.action.target]
        .filter((card) => !card.flipped)
        .map((card) => card.card)
        .map((card) => ({ type: 'Reveal', blockable: false, challengable: false, card })) as Array<RevealAction>;
      return { revealActions };
    } else if (resolvingAction.action.type === 'Exchange' && playerIndex === resolvingAction.player) {
      const discardActions = this.state.hands[resolvingAction.player]
        .filter((card) => !card.flipped)
        .map((card) => card.card)
        .map((card) => ({ type: 'Discard', blockable: false, challengable: false, card })) as Array<DiscardAction>;
      return { discardActions };
    }
    return { revealActions: [] };
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

  resolveActionPlayedPhaseAction({ player, action }: PlayerAction) {
    switch (action.type) {
      case 'Assassinate':
        // Let the assassinated player choose which card to flip
        this.state.phase = 'Pre_Resolving';
        break;
      case 'Coup':
        this.state.players[player].coins -= 2;
        // Let coup'd player choose which card to flip
        this.state.phase = 'Pre_Resolving';
        break;
      case 'Exchange':
        // Draw two return 2
        this.state.phase = 'Pre_Resolving';
        break;
      case 'Foreign Aid':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 2 });
        this.state.phase = 'Resolving';
        break;
      case 'Income':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 1 });
        this.state.phase = 'Resolving';
        break;
      case 'Steal':
        this.state.resolutionActions.push({
          type: 'Steal',
          gainingPlayer: player,
          losingPlayer: action.target,
          coins: 2,
        });
        this.state.phase = 'Resolving';
        break;
      case 'Tax':
        this.state.resolutionActions.push({ type: 'Gain Coins', gainingPlayer: player, coins: 3 });
        this.state.phase = 'Resolving';
        break;
    }
  }

  resolveBlockedActionPhaseAction({ player, action }: PlayerAction) {
    assert(action.type === 'Block');
    this.state.resolutionActions.push({ type: 'Blocked', blockingPlayer: player });
    this.state.phase = 'Resolving';
  }

  resolvePreResolvingPhaseAction({ player, action }: PlayerAction) {
    assert(action.type === 'Reveal');
    const cardToRevealIndex = this.getIndexOfUnrevealedCard(player, (action as RevealAction).card);
    // Flip the revealed card targetted player.
    this.state.resolutionActions.push({
      type: 'Reveal',
      player,
      card: this.state.hands[player][cardToRevealIndex].card,
    });
    this.state.phase = 'Resolving';
  }

  resolveChallengedActionFailedPhaseAction({ player, action }: PlayerAction) {
    assert(action.type === 'Reveal');
    const originalAction = this.state.currTurnActions[0];
    const cardToRevealIndex = this.getIndexOfUnrevealedCard(player, (action as RevealAction).card);
    assert(cardToRevealIndex > -1, 'Player has not valid card to reveal');
    // Flip the revealed card of the challenger.
    this.state.resolutionActions.push({
      type: 'Reveal',
      player,
      card: this.state.hands[player][cardToRevealIndex].card,
    });
    // Resolve the original action
    this.resolveActionPlayedPhaseAction(originalAction);
  }

  resolveChallengedActionSucceededPhaseAction({ player, action }: PlayerAction) {
    assert(action.type === 'Reveal');
    const originalAction = this.state.currTurnActions[0];
    assert(player === originalAction.player, 'Revealing player should be the same as original action player');
    const cardToRevealIndex = this.getIndexOfUnrevealedCard(originalAction.player, (action as RevealAction).card);
    assert(cardToRevealIndex > -1, 'Player has not valid card to reveal');
    // Flip the revealed card of the player of the original action.
    this.state.resolutionActions.push({
      type: 'Reveal',
      player,
      card: this.state.hands[player][cardToRevealIndex].card,
    });
    this.state.phase = 'Resolving';
  }

  resolveChallengedBlockedActionFailedPhaseAction({ player, action }: PlayerAction) {
    assert(action.type === 'Reveal');
    const blockAction = this.state.currTurnActions[1];
    const cardToRevealIndex = this.getIndexOfUnrevealedCard(player, (action as RevealAction).card);
    assert(cardToRevealIndex > -1, 'Player has not valid card to reveal');
    // Flip the revealed card of the challenger.
    this.state.resolutionActions.push({
      type: 'Reveal',
      player,
      card: this.state.hands[player][cardToRevealIndex].card,
    });
    // Resolve the block action
    this.resolveBlockedActionPhaseAction(blockAction);
  }

  resolveChallengedBlockedActionSucceededPhaseAction({ player, action }: PlayerAction) {
    assert(action.type === 'Reveal');
    const originalAction = this.state.currTurnActions[0];
    const blockAction = this.state.currTurnActions[1];
    assert(blockAction.player === player, 'Revealing player should be the same as the blocking player');
    assert(blockAction.action.type === 'Block');
    const cardToRevealIndex = this.getIndexOfUnrevealedCard(player, (action as RevealAction).card);
    assert(cardToRevealIndex > -1, 'Player has not valid card to reveal');
    // Flip the revealed card of the player with the block action.
    this.state.resolutionActions.push({
      type: 'Reveal',
      player,
      card: this.state.hands[player][cardToRevealIndex].card,
    });
    // Resolve the original action
    this.resolveActionPlayedPhaseAction(originalAction);
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
