import Coup from './src/server/coup';

const players = [
  { nickname: 'jbatch', id: 'id1' },
  { nickname: 'lbatch', id: 'id2' },
];
const coup = new Coup(players);

const blockableCaptainState =
  '{"players":[{"index":0,"coins":2,"nickname":"jbatch","id":"id1"},{"index":1,"coins":2,"nickname":"lbatch","id":"id2"}],"deck":["Assassin","Duke","Assassin","Captain","Duke","Ambassador","Contessa","Contessa","Duke","Ambassador","Assassin"],"hands":[[{"card":"Captain","flipped":false},{"card":"Ambassador","flipped":false}],[{"card":"Captain","flipped":false},{"card":"Contessa","flipped":false}]],"currTurn":0,"currTurnActions":[{"player":0,"action":{"type":"Steal","blockable":true,"challengable":true,"target":1}}],"resolutionActions":[],"phase":"Action_Played","actions":[{"challengeActions":[],"blockActions":[],"bluffBlockActions":[]},{"challengeActions":[{"type":"Challenge","blockable":false,"challengable":false}],"blockActions":[{"type":"Block","blockable":false,"challengable":true,"card":"Captain"}],"bluffBlockActions":[{"type":"Block","blockable":false,"challengable":true,"card":"Ambassador"}]}]}';

const Challenged_Block_Action =
  '{"players":[{"index":0,"coins":2,"nickname":"jbatch","id":"id1"},{"index":1,"coins":2,"nickname":"lbatch","id":"id2"}],"deck":["Assassin","Duke","Assassin","Captain","Duke","Ambassador","Contessa","Contessa","Duke","Ambassador","Assassin"],"hands":[[{"card":"Captain","flipped":false},{"card":"Ambassador","flipped":false}],[{"card":"Captain","flipped":false},{"card":"Contessa","flipped":false}]],"currTurn":0,"currTurnActions":[{"player":0,"action":{"type":"Steal","blockable":true,"challengable":true,"target":1}},{"player":1,"action":{"type":"Block","blockable":false,"challengable":true,"card":"Captain"}},{"player":0,"action":{"type":"Challenge","blockable":false,"challengable":false}}],"resolutionActions":[],"phase":"Challenged_Block_Action","actions":[{"revealActions":[]},{"revealActions":[{"type":"Reveal","blockable":false,"challengable":false,"card":"Captain"},{"type":"Reveal","blockable":false,"challengable":false,"card":"Contessa"}]}]}';

const Challenged_Action =
  '{"players":[{"index":0,"coins":2,"nickname":"jbatch","id":"id1"},{"index":1,"coins":2,"nickname":"lbatch","id":"id2"}],"deck":["Duke","Contessa","Duke","Duke","Contessa","Assassin","Ambassador","Captain","Captain","Ambassador","Contessa"],"hands":[[{"card":"Ambassador","flipped":false},{"card":"Assassin","flipped":false}],[{"card":"Captain","flipped":false},{"card":"Assassin","flipped":false}]],"currTurn":0,"currTurnActions":[{"player":0,"action":{"type":"Assassinate","blockable":true,"challengable":true,"target":1}},{"player":1,"action":{"type":"Challenge","blockable":false,"challengable":false}}],"resolutionActions":[],"phase":"Challenged_Action","actions":[{"revealActions":[{"type":"Reveal","blockable":false,"challengable":false,"card":"Ambassador"},{"type":"Reveal","blockable":false,"challengable":false,"card":"Assassin"}]},{"revealActions":[]}]}';
const challenge_action_failed =
  '{"players":[{"index":0,"coins":2,"nickname":"jbatch","id":"id1"},{"index":1,"coins":2,"nickname":"lbatch","id":"id2"}],"deck":["Duke","Contessa","Duke","Duke","Contessa","Assassin","Ambassador","Captain","Captain","Ambassador","Contessa"],"hands":[[{"card":"Ambassador","flipped":false},{"card":"Assassin","flipped":false}],[{"card":"Captain","flipped":false},{"card":"Assassin","flipped":false}]],"currTurn":0,"currTurnActions":[{"player":0,"action":{"type":"Assassinate","blockable":true,"challengable":true,"target":1}},{"player":1,"action":{"type":"Challenge","blockable":false,"challengable":false}},{"player":0,"action":{"type":"Reveal","blockable":false,"challengable":false,"card":"Assassin"}}],"resolutionActions":[{"type":"Reveal","player":0,"card":"Assassin"}],"phase":"Challenged_Action_Failed","actions":[{"revealActions":[]},{"revealActions":[{"type":"Reveal","blockable":false,"challengable":false,"card":"Captain"},{"type":"Reveal","blockable":false,"challengable":false,"card":"Assassin"}]}]}';
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

console.log('READY');
// coup.loadJson(challenge_action_failed);
