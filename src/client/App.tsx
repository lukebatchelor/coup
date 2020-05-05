import React, { useContext, useState, useEffect } from 'react';

import { CssBaseline, makeStyles, AppBar, Toolbar, IconButton, Box, Typography } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';

import { Views, StartScreen, InstructionsScreen, JoinGameScreen, LobbyScreen, PlayingScreen } from './views';
import { CurViewContext, SocketContext, PlayerContext } from './contexts';

const useStyles = makeStyles((theme) => ({
  main: {
    display: 'flex',
    flexGrow: 1,
    padding: theme.spacing(3),
    marginTop: theme.mixins.toolbar.minHeight,
  },
  appConainer: {
    height: '100%',
    display: 'flex',
  },
}));

function shouldShowHomeButton(curView: Views) {
  return [].includes(curView);
}

export function App() {
  const classes = useStyles();
  const [curView, setCurView] = useContext(CurViewContext);
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (socket.initialised) {
      socket.on('welcome', (data) => {
        console.log('welcome', data);
        const { nickName, roomCode, host, inGame } = data;
        setPlayerInfo({ nickName, roomCode, isHost: host, inGame });
        if (nickName && roomCode) {
          if (inGame) setCurView(Views.PlayingScreen);
          else setCurView(Views.Lobby);
        }
      });
    }
  }, [socket]);

  return (
    <div className={classes.appConainer}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          {shouldShowHomeButton(curView) && (
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={() => {}}>
              <HomeIcon />
            </IconButton>
          )}
          <Box flexGrow={1}>
            <Typography variant="h5" noWrap align="center">
              Coup
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <main className={classes.main}>
        {curView === Views.StartScreen && <StartScreen />}
        {curView === Views.InstructionsScreen && <InstructionsScreen />}
        {curView === Views.JoinGame && <JoinGameScreen />}
        {curView === Views.Lobby && <LobbyScreen />}
        {curView === Views.PlayingScreen && !playerInfo.isHost && <PlayingScreen />}
        {curView === Views.PlayingScreen && playerInfo.isHost && <LobbyScreen />}
      </main>
    </div>
  );
}
