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

console.log('READY');
// coup.loadJson(challenge_action_failed);
coup.doAction(0, { type: 'Exchange', blockable: false, challengable: true });
coup.resolve();
actions();
hands();
coup.state.deck[0];
coup.state.deck[1];
