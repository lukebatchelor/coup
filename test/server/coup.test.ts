import Coup from '../../src/server/coup';

const EMPTY_ACTION: AvailableActions = { bluffActions: [], characterActions: [], generalActions: [] };

// sharedGlobals
let game: Coup;

beforeEach(() => {
  game = undefined;
});

function getGameWithState({ players, hands, currTurn }: Partial<State>): Coup {
  const defaultPlayers = [
    { index: 0, coins: 2, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
    { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
  ];
  const deck = [
    'Ambassador',
    'Ambassador',
    'Captain',
    'Duke',
    'Assassin',
    'Duke',
    'Contessa',
    'Contessa',
    'Ambassador',
    'Assassin',
    'Contessa',
  ];
  const defaultHands = [
    [
      { card: 'Duke', flipped: false, replacing: false },
      { card: 'Captain', flipped: false, replacing: false },
    ],
    [
      { card: 'Captain', flipped: false, replacing: false },
      { card: 'Assassin', flipped: false, replacing: false },
    ],
  ];
  const state = {
    players: players !== undefined ? players : defaultPlayers,
    deck,
    hands: hands !== undefined ? hands : defaultHands,
    currTurn: currTurn !== undefined ? currTurn : 0,
    challengeUsable: true,
    actionStack: [],
    actionList: [],
    actions: [],
  } as State;
  game = new Coup([]);
  game.loadJson(JSON.stringify(state));
  return game;
}

function doAction(player: number, action: Action) {
  const actionStack = game.state.actionStack;
  const actionStackLengthBeforeAction = [...actionStack].length;
  game.doAction(player, action);
  // TODO state validation after action played
}

function income(): Action {
  return { type: 'Income' };
}

function foreignAid(): Action {
  return { type: 'Foreign Aid' };
}

function tax(): Action {
  return { type: 'Tax' };
}

function steal(target: number = 1): Action {
  return { type: 'Steal', target };
}

function assassinate(target: number = 1, disabled: boolean = true): Action {
  return { type: 'Assassinate', target, disabled };
}

function coup(target: number = 1): Action {
  return { type: 'Coup', target };
}

function exchange(): Action {
  return { type: 'Exchange' };
}

function choose(reason: ChooseReason, ...cards: Array<Card>): Action {
  return { type: 'Choose', cards, reason };
}

function block(card: Card): Action {
  return { type: 'Block', card };
}

function challenge(): Action {
  return { type: 'Challenge' };
}

function pass(): Action {
  return { type: 'Pass' };
}

function resolving(): Action {
  return { type: 'Resolving' };
}

function declareWinner(): Action {
  return { type: 'Declare Winner' };
}

function revealingInfluence(reason: 'Failed Bluff' | 'Failed Challenge' | 'Assisination' | 'Coup'): Action {
  return { type: 'Revealing Influence', reason };
}

function exchangingInfluence(): Action {
  return { type: 'Exchanging Influence' };
}

function gainCoins(player: number = 0, coins = 1): ResolutionAction {
  return { type: 'Gain Coins', gainingPlayer: player, coins };
}

function loseCoins(player: number = 0, coins = 1): ResolutionAction {
  return { type: 'Lose Coins', losingPlayer: player, coins };
}

function draw(player: number): ResolutionAction {
  return { type: 'Draw', player };
}

function flip(player: number, card: Card): ResolutionAction {
  return { type: 'Flip', player, card };
}

function discard(player: number, card: Card): ResolutionAction {
  return { type: 'Discard', player, card };
}

function expectNoActions(player: number = 0) {
  expect(game.state.actions[player]).toStrictEqual(EMPTY_ACTION);
}

function expectResolving() {
  expect(game.state.actionStack).toStrictEqual([{ player: 0, action: resolving() }]);
  expect(game.state.actions[0]).toStrictEqual(EMPTY_ACTION);
  expect(game.state.actions[1]).toStrictEqual(EMPTY_ACTION);
}

function expectDeclareWinner() {
  expect(game.state.actionStack).toStrictEqual([{ player: 0, action: declareWinner() }]);
  expect(game.state.actions[0]).toStrictEqual(EMPTY_ACTION);
  expect(game.state.actions[1]).toStrictEqual(EMPTY_ACTION);
}

it('Can start a new game of coup', () => {
  game = getGameWithState({});

  const players = game.state.players;
  expect(players.length).toBe(2);
  expect(players[0].coins).toBe(2);
  expect(players[1].coins).toBe(2);
  const hands = game.state.hands;
  expect(hands.length).toBe(2);
  expect(hands[0].every((card) => !card.flipped)).toBe(true);
  expect(hands[1].every((card) => !card.flipped)).toBe(true);
});

describe('No actions on stack', () => {
  it('Players have correct available actions', () => {
    game = getGameWithState({});
    const state = game.state;

    const player1Actions = state.actions[1];
    expect(player1Actions).toStrictEqual(EMPTY_ACTION);

    const player0Actions = state.actions[0];
    expect(player0Actions.generalActions).toStrictEqual([income(), foreignAid()]);
    expect(player0Actions.characterActions).toStrictEqual([tax(), steal()]);
    expect(player0Actions.bluffActions).toStrictEqual([assassinate(), exchange()]);
    expect(player0Actions.chooseActions).toBeUndefined();
  });

  it('Player can afford coup', () => {
    const players = [
      { index: 0, coins: 7, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
      { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
    ];
    game = getGameWithState({ players });
    const state = game.state;
    const player0Actions = state.actions[0];
    expect(player0Actions.generalActions).toStrictEqual([income(), foreignAid(), coup()]);
    expect(player0Actions.bluffActions).toStrictEqual([assassinate(1, false), exchange()]);
  });

  it('Player has to coup when they have 10 coins', () => {
    const players = [
      { index: 0, coins: 10, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
      { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
    ];
    game = getGameWithState({ players });
    const state = game.state;
    const player0Actions = state.actions[0];
    expect(player0Actions.generalActions).toStrictEqual([coup()]);
    expect(player0Actions.characterActions).toStrictEqual([]);
    expect(player0Actions.bluffActions).toStrictEqual([]);
    expect(player0Actions.chooseActions).toBeUndefined();
  });

  it('Playing an unchallenged Income', () => {
    game = getGameWithState({});
    const state = game.state;

    doAction(0, income());
    expectNoActions(0);
    expectNoActions(1);

    game.resolve();
    expectResolving();

    game.resolve();
    expect(state.players[0].coins).toBe(3);
    expect(state.players[1].coins).toBe(2);
  });

  it('Playing an unchallenged Foreign Aid', () => {
    game = getGameWithState({});
    const state = game.state;

    doAction(0, foreignAid());

    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [block('Duke')],
      characterActions: [],
      generalActions: [],
    });

    game.resolve();
    expect(state.actionStack).toStrictEqual([{ player: 0, action: resolving() }]);
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    game.resolve();
    expect(state.players[0].coins).toBe(4);
    expect(state.players[1].coins).toBe(2);
  });

  it('Playing an unchallenged Tax', () => {
    game = getGameWithState({});
    const state = game.state;

    doAction(0, tax());

    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });

    game.resolve();
    expectResolving();

    game.resolve();
    expect(state.players[0].coins).toBe(5);
    expect(state.players[1].coins).toBe(2);
  });

  it('Playing an unchallenged Steal', () => {
    game = getGameWithState({});
    const state = game.state;

    doAction(0, steal(1));

    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [block('Ambassador')],
      characterActions: [block('Captain')],
      generalActions: [challenge(), pass()],
    });

    game.resolve();
    expectResolving();

    game.resolve();
    expect(state.players[0].coins).toBe(4);
    expect(state.players[1].coins).toBe(0);
  });

  it('Playing an unchallenged Assassinate', () => {
    const players = [
      { index: 0, coins: 3, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
      { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
    ];
    game = getGameWithState({ players });
    const state = game.state;

    doAction(0, assassinate(1, false));
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [block('Contessa')],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });

    game.resolve();
    expect(state.actionStack).toStrictEqual([{ player: 1, action: revealingInfluence('Assisination') }]);
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      characterActions: [],
      bluffActions: [],
      generalActions: [],
      chooseActions: {
        cards: ['Captain', 'Assassin'],
        actions: [choose('Assisination', 'Captain'), choose('Assisination', 'Assassin')],
      },
    });

    doAction(1, choose('Assisination', 'Captain'));

    expectResolving();

    game.resolve();
    expect(state.players[0].coins).toBe(0);
    expect(state.players[1].coins).toBe(2);
    expect(state.hands[1][0]).toStrictEqual({ card: 'Captain', flipped: true, replacing: false });
    expect(state.hands[1][1]).toStrictEqual({ card: 'Assassin', flipped: false, replacing: false });
  });

  it('Playing an Coup', () => {
    const players = [
      { index: 0, coins: 7, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
      { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
    ];
    game = getGameWithState({ players });
    const state = game.state;

    doAction(0, coup(1));
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    game.resolve();
    expect(state.actionStack).toStrictEqual([{ player: 1, action: revealingInfluence('Coup') }]);
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      characterActions: [],
      bluffActions: [],
      generalActions: [],
      chooseActions: {
        cards: ['Captain', 'Assassin'],
        actions: [choose('Coup', 'Captain'), choose('Coup', 'Assassin')],
      },
    });

    doAction(1, choose('Coup', 'Captain'));

    expectResolving();

    game.resolve();
    expect(state.players[0].coins).toBe(0);
    expect(state.players[1].coins).toBe(2);
    expect(state.hands[1][0]).toStrictEqual({ card: 'Captain', flipped: true, replacing: false });
    expect(state.hands[1][1]).toStrictEqual({ card: 'Assassin', flipped: false, replacing: false });
  });

  it('Playing an unchallenged Exchange', () => {
    game = getGameWithState({});
    const state = game.state;

    doAction(0, exchange());
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });

    game.resolve();
    expect(state.actionStack).toStrictEqual([{ player: 0, action: exchangingInfluence() }]);
    expect(state.actions[0]).toStrictEqual({
      characterActions: [],
      bluffActions: [],
      generalActions: [],
      chooseActions: {
        cards: ['Duke', 'Captain', 'Ambassador', 'Ambassador'],
        actions: [
          choose('Exchange', 'Duke', 'Captain'),
          choose('Exchange', 'Duke', 'Ambassador'),
          choose('Exchange', 'Captain', 'Ambassador'),
          choose('Exchange', 'Ambassador', 'Ambassador'),
        ],
      },
    });
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    doAction(0, choose('Exchange', 'Captain', 'Ambassador'));

    expectResolving();

    game.resolve();
    expect(state.players[0].coins).toBe(2);
    expect(state.players[1].coins).toBe(2);
    expect(state.hands[0].length).toBe(2);
    expect(state.hands[0][0]).toStrictEqual({ card: 'Duke', flipped: false, replacing: false });
    expect(state.hands[0][1]).toStrictEqual({ card: 'Ambassador', flipped: false, replacing: false });
  });
});

describe('Blocking', () => {
  it('Player blocks action and is not challenged', () => {
    const players = [
      { index: 0, coins: 3, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
      { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
    ];
    game = getGameWithState({ players });
    const state = game.state;

    doAction(0, assassinate(1, false));
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [block('Contessa')],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });

    doAction(1, block('Contessa'));
    expect(state.actions[0]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    game.resolve();
    expectResolving();
  });

  it('Player blocks action and is challenged successfully', () => {
    const players = [
      { index: 0, coins: 3, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
      { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
    ];
    game = getGameWithState({ players });
    const state = game.state;

    doAction(0, assassinate(1, false));
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [block('Contessa')],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });

    doAction(1, block('Contessa'));
    expect(state.actions[0]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    doAction(0, challenge());
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    // Lose card for successful challenge
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [],
      chooseActions: {
        cards: ['Captain', 'Assassin'],
        actions: [choose('Failed Bluff', 'Captain'), choose('Failed Bluff', 'Assassin')],
      },
    });

    doAction(1, choose('Failed Bluff', 'Captain'));

    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    // Lose card for assassination
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [],
      chooseActions: { cards: ['Assassin'], actions: [choose('Assisination', 'Assassin')] },
    });

    doAction(1, choose('Assisination', 'Assassin'));
    expectResolving();

    game.resolve();
    expectDeclareWinner();
    expect(state.players[1].eliminated).toBe(true);
  });

  it('Player blocks action and is challenged unsuccessfully', () => {
    const players = [
      { index: 0, coins: 3, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
      { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
    ];
    const hands: Array<[CardInHand, CardInHand]> = [
      [
        { card: 'Assassin', flipped: false, replacing: false },
        { card: 'Assassin', flipped: false, replacing: false },
      ],
      [
        { card: 'Contessa', flipped: false, replacing: false },
        { card: 'Contessa', flipped: false, replacing: false },
      ],
    ];
    game = getGameWithState({ players, hands });
    const state = game.state;

    doAction(0, assassinate(1, false));
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [],
      characterActions: [block('Contessa')],
      generalActions: [challenge(), pass()],
    });

    doAction(1, block('Contessa'));
    expect(state.actions[0]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    doAction(0, challenge());
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    // Reveal Contessa to beat challenge
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [],
      chooseActions: { cards: ['Contessa', 'Contessa'], actions: [choose('Failed Challenge', 'Contessa')] },
    });

    doAction(1, choose('Failed Challenge', 'Contessa'));
    // Lose card for failed challenge.
    expect(state.actions[0]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [],
      chooseActions: { cards: ['Assassin', 'Assassin'], actions: [choose('Succeeded Challenge', 'Assassin')] },
    });
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    doAction(0, choose('Succeeded Challenge', 'Assassin'));
    expectResolving();

    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    game.resolve();
    expect(state.hands[0]).toStrictEqual([
      { card: 'Assassin', flipped: true, replacing: false },
      { card: 'Assassin', flipped: false, replacing: false },
    ]);
    expect(state.hands[1]).toStrictEqual([
      { card: 'Contessa', flipped: false, replacing: false },
      { card: 'Ambassador', flipped: false, replacing: false },
    ]);
  });
});

describe('Challenging', () => {
  it('an action successfully', () => {
    game = getGameWithState({});
    const state = game.state;

    doAction(0, exchange());
    expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
    expect(state.actions[1]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [challenge(), pass()],
    });

    doAction(1, challenge());
    expect(state.actions[0]).toStrictEqual({
      bluffActions: [],
      characterActions: [],
      generalActions: [],
      chooseActions: {
        cards: ['Duke', 'Captain'],
        actions: [choose('Failed Bluff', 'Duke'), choose('Failed Bluff', 'Captain')],
      },
    });
    expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

    doAction(0, choose('Failed Bluff', 'Duke'));
    expectResolving();

    game.resolve();
    expect(state.hands[0]).toStrictEqual([
      { card: 'Duke', flipped: true, replacing: false },
      { card: 'Captain', flipped: false, replacing: false },
    ]);
  });

  describe('an action unsuccessfully', () => {
    beforeEach(() => {
      game = getGameWithState({});
      const state = game.state;

      doAction(0, steal());
      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [block('Ambassador')],
        characterActions: [block('Captain')],
        generalActions: [challenge(), pass()],
      });

      doAction(1, challenge());
      expect(state.actions[0]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [],
        chooseActions: {
          cards: ['Duke', 'Captain'],
          actions: [choose('Failed Bluff', 'Duke'), choose('Failed Challenge', 'Captain')],
        },
      });
      expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

      doAction(0, choose('Failed Challenge', 'Captain'));
    });

    it('with no block', () => {
      const state = game.state;

      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [],
        chooseActions: {
          cards: ['Captain', 'Assassin'],
          actions: [choose('Succeeded Challenge', 'Captain'), choose('Succeeded Challenge', 'Assassin')],
        },
      });

      doAction(1, choose('Succeeded Challenge', 'Assassin'));
      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [block('Ambassador')],
        characterActions: [block('Captain')],
        generalActions: [], // Can't challenge again
      });

      game.resolve();
      expectResolving();
    });

    it('with block that is not challenged', () => {
      const state = game.state;

      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [],
        chooseActions: {
          cards: ['Captain', 'Assassin'],
          actions: [choose('Succeeded Challenge', 'Captain'), choose('Succeeded Challenge', 'Assassin')],
        },
      });

      // Lose card for failing the initial challenge
      doAction(1, choose('Succeeded Challenge', 'Assassin'));
      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [block('Ambassador')],
        characterActions: [block('Captain')],
        generalActions: [], // Can't challenge again
      });

      doAction(1, block('Captain'));
      expect(state.actions[0]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [challenge(), pass()],
      });
      expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

      game.resolve();
      expectResolving();
    });

    it('with block that is challenged unsuccessfully', () => {
      const state = game.state;

      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [],
        chooseActions: {
          cards: ['Captain', 'Assassin'],
          actions: [choose('Succeeded Challenge', 'Captain'), choose('Succeeded Challenge', 'Assassin')],
        },
      });

      // Lose card for failing the initial challenge
      doAction(1, choose('Succeeded Challenge', 'Assassin'));
      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [block('Ambassador')],
        characterActions: [block('Captain')],
        generalActions: [], // Can't challenge again
      });

      doAction(1, block('Captain'));
      expect(state.actions[0]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [challenge(), pass()],
      });
      expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

      doAction(0, challenge());
      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [],
        chooseActions: { cards: ['Captain'], actions: [choose('Failed Challenge', 'Captain')] },
      });

      doAction(1, choose('Failed Challenge', 'Captain'));
      expect(state.actions[0]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [],
        chooseActions: {
          cards: ['Duke'],
          actions: [choose('Succeeded Challenge', 'Duke')],
        },
      });
      expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

      doAction(0, choose('Succeeded Challenge', 'Duke'));
      expectResolving();

      game.resolve();
      // Player 0 started with Duke/Captain and discarded the Captain to win a challenge then had to flip
      // the Duke after failing the opponent's block.
      expect(state.hands[0]).toStrictEqual([
        { card: 'Duke', flipped: true, replacing: false },
        { card: 'Ambassador', flipped: false, replacing: false },
      ]);
      // Player 1 started with Captain/Assassin and flipped the Asassin after failing the initial challenge,
      // then discarded the Captain to win the challenged block.
      // expect(state.hands[1]).toStrictEqual([
      //   { card: 'Assassin', flipped: true, replacing: false },
      //   { card: 'Captain', flipped: false, replacing: false },
      // ]);
      // TODO: fix randomness in long test
    });

    it('with block that is challenged successfully', () => {
      const state = game.state;

      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [],
        chooseActions: {
          cards: ['Captain', 'Assassin'],
          actions: [choose('Succeeded Challenge', 'Captain'), choose('Succeeded Challenge', 'Assassin')],
        },
      });

      // Lose card for failing the initial challenge
      doAction(1, choose('Succeeded Challenge', 'Assassin'));
      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [block('Ambassador')],
        characterActions: [block('Captain')],
        generalActions: [], // Can't challenge again
      });

      doAction(1, block('Ambassador'));
      expect(state.actions[0]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [challenge(), pass()],
      });
      expect(state.actions[1]).toStrictEqual(EMPTY_ACTION);

      doAction(0, challenge());
      expect(state.actions[0]).toStrictEqual(EMPTY_ACTION);
      expect(state.actions[1]).toStrictEqual({
        bluffActions: [],
        characterActions: [],
        generalActions: [],
        chooseActions: { cards: ['Captain'], actions: [choose('Failed Bluff', 'Captain')] },
      });

      doAction(1, choose('Failed Bluff', 'Captain'));
      expectResolving();

      game.resolve();
      expectDeclareWinner();
      expect(state.players[1].eliminated).toBe(true);
    });
  });
});

// describe('Passing', () => {
//   it('should remove challenge action if someone passes', () => {
//     const players = [
//       { index: 0, coins: 2, deltaCoins: 0, nickname: 'jbatch', id: '1', eliminated: false },
//       { index: 1, coins: 2, deltaCoins: 0, nickname: 'lbatch', id: '2', eliminated: false },
//       { index: 2, coins: 2, deltaCoins: 0, nickname: 'guy', id: '3', eliminated: false },
//     ];
//     game = getGameWithState({ players });

//     doAction(0, assassinate(1));
//   });
// });
