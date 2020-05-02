import React, { useState, useEffect } from 'react';
import { initialiseSocket } from '../sockets';

type Socket = SocketIOClient.Socket;
const defaultValue: Socket = null;

const SocketContext = React.createContext<Socket>(defaultValue);

const SocketProvider: React.FC = (props) => {
  const [socket, setSocket] = useState<Socket>(defaultValue);

  useEffect(() => {
    setSocket(initialiseSocket());
  }, []);

  return <SocketContext.Provider value={socket}>{props.children}</SocketContext.Provider>;
};

export { SocketContext, SocketProvider };
