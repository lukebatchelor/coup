import Coup from './src/server/coup';

const coup = new Coup({ numberPlayers: 3 });

console.log(coup.getActions()[0]);
