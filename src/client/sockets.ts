import socketIO from 'socket.io-client';

// our single instance of socket that everyone will use
let socket: SocketIOClient.Socket;

function getSocket() {
  if (!socket) {
    throw Error('Attempted to load socket before it was initialised');
  }
  return socket;
}

function initialiseSocket() {
  const regex = /(.*?)\/coup$/;
  if (process.env.BASE_URL.match(regex)) {
    let uri = process.env.BASE_URL.match(regex)[1];
    socket = socketIO.connect(uri, { path: '/coup/socket.io' });
  } else {
    socket = socketIO.connect(process.env.BASE_URL);
  }

  socket.on('connect', () => {
    const id = localStorage.getItem('id');
    socket.emit('handshake', { id });
  });

  socket.on('welcome', (welcomeMessage: WelcomeMessage) => {
    localStorage.setItem('id', welcomeMessage.id);
  });

  return socket;
}

export { initialiseSocket, getSocket };
