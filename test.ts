import Coup from './src/server/coup';

const players = [
  { nickname: 'jbatch', id: 'id1' },
  { nickname: 'lbatch', id: 'id2' },
];
const coup = new Coup(players);

const s =
  '{"players":[{"index":0,"coins":2,"nickname":"jbatch","id":"id1"},{"index":1,"coins":2,"nickname":"lbatch","id":"id2"}],"deck":["Ambassador","Captain","Contessa","Captain","Assassin","Duke","Captain","Assassin","Assassin","Ambassador","Contessa"],"hands":[[{"card":"Ambassador","flipped":false},{"card":"Duke","flipped":false}],[{"card":"Duke","flipped":false},{"card":"Contessa","flipped":false}]],"currTurn":0,"currTurnActions":[{"player":0,"action":{"type":"Tax","blockable":false,"challengable":true}},{"player":1,"action":{"type":"Challenge","blockable":false,"challengable":false}}],"resolutionActions":[],"phase":"Action","actions":[{"generalActions":[],"characterActions":[],"bluffActions":[],"chooseActions":{"cards":["Ambassador","Duke"],"actions":[{"type":"Choose","blockable":false,"challengable":false,"cards":["Ambassador"]},{"type":"Choose","blockable":false,"challengable":false,"cards":["Duke"]}]}},{"generalActions":[],"characterActions":[],"bluffActions":[]}]}';
function hands() {
  console.log('Hands:');
  for (var i = 0; i < coup.state.players.length; i++) {
    console.log(
      `${coup.state.players[i].nickname}: [${coup.state.hands[i]
        .map((c) => `${c.card} [${c.flipped ? 'FLIPPED' : 'UNFLIPPED'}]`)
        .join(', ')}]`
    );
  }
}

function actions() {
  console.log('Actions: ');
  for (var i = 0; i < coup.state.players.length; i++) {
    const nickname = coup.state.players[i].nickname;
    const actions = coup.state.actions[i];
    console.log(`${nickname}: [${JSON.stringify(actions)}]`);
  }
}

function actions2() {
  console.log('Actions: ');
  for (var i = 0; i < coup.state.players.length; i++) {
    const nickname = coup.state.players[i].nickname;
    const actions = coup.state.actions[i];
    console.log(`${nickname}: [${JSON.stringify(actions, null, 2)}]`);
  }
}

function stack() {
  return coup.state.actionStack;
}

console.log('READY');
// coup.loadJson(challenge_action_failed);

coup.doAction(0, { type: 'Assassinate', blockable: true, challengable: true, target: 1 });
coup.resolve();
const a = coup.state.actions[1].chooseActions.actions[0];
coup.doAction(1, a);
coup.resolve();

coup.doAction(1, { type: 'Assassinate', blockable: true, challengable: true, target: 0 });
coup.resolve();
const b = coup.state.actions[0].chooseActions.actions[0];
coup.doAction(0, b);
coup.resolve();

coup.doAction(0, { type: 'Income', blockable: false, challengable: false });
coup.resolve();
coup.resolve();

coup.doAction(1, { type: 'Assassinate', blockable: true, challengable: true, target: 0 });
coup.resolve();
const c = coup.state.actions[0].chooseActions.actions[0];
coup.doAction(0, c);
coup.resolve();
