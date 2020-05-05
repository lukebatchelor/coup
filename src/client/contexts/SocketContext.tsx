import React, { useState, useEffect } from 'react';
import { initialiseSocket, safeEmit, safeOn, safeOff } from '../sockets';

type SocketContextType = {
  _socket: SocketIOClient.Socket;
  emit: typeof safeEmit;
  on: typeof safeOn;
  off: typeof safeOff;
};
const defaultValue: SocketContextType = {
  _socket: null,
  emit: safeEmit,
  on: safeOn,
  off: safeOff,
};

const SocketContext = React.createContext<SocketContextType>(defaultValue);

const SocketProvider: React.FC = (props) => {
  const [socket, setSocket] = useState<SocketIOClient.Socket>(null);

  useEffect(() => {
    setSocket(initialiseSocket());
  }, []);

  const value = {
    _socket: socket,
    emit: safeEmit,
    on: safeOn,
    off: safeOff,
  };

  return <SocketContext.Provider value={value}>{props.children}</SocketContext.Provider>;
};

export { SocketContext, SocketProvider };
