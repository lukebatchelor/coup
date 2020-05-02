import React, { useState } from 'react';

// @ts-ignore react-dom types seem to be super buggy, not importing them
import ReactDom from 'react-dom';

import { App } from './App';
import { CurViewProvider } from './contexts/CurViewContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { SocketProvider } from './contexts/SocketContext';

ReactDom.render(
  <CurViewProvider>
    <PlayerProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </PlayerProvider>
  </CurViewProvider>,
  document.getElementById('root')
);
