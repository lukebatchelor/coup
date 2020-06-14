export function getStateInfo(state: GameState) {
  const id = localStorage.getItem('id');
  const isMyTurn = state.players[state.currTurn].id === id;
  const curTurnName = state.players[state.currTurn].nickname;
  const lastAction = state.actionList.length ? state.actionList[state.actionList.length - 1] : null;
  const me = state.players.find((p) => p.id === id);
  const isHost = !me;

  return {
    isMyTurn,
    curTurnName,
    lastAction,
    me,
    isHost,
  };
}
