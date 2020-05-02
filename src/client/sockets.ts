import socketIO from 'socket.io-client';

type WelcomeData = {
  id: string;
  roomCode?: string;
  nickName?: string;
  inGame: boolean;
};

// our single instance of socket that everyone will use
let socket: SocketIOClient.Socket;

function getSocket() {
  if (!socket) {
    throw Error('Attempted to load socket before it was initialised');
  }
  return socket;
}

function initialiseSocket(welcomeCallback: (welcomeData: WelcomeData) => void) {
  const regex = /(.*?)\/startups$/;
  if (process.env.BASE_URL.match(regex)) {
    let uri = process.env.BASE_URL.match(regex)[1];
    socket = socketIO.connect(uri, { path: '/startups/socket.io' });
  } else {
    socket = socketIO.connect(process.env.BASE_URL);
  }

  socket.on('connect', () => {
    const id = localStorage.getItem('id');
    socket.emit('handshake', { id });
  });

  socket.on('welcome', welcomeCallback);

  return socket;
}

export { initialiseSocket, getSocket };
