import React, { useContext, useState, useEffect } from 'react';

import { CssBaseline, makeStyles, AppBar, Toolbar, IconButton, Box, Typography } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import HelpIcon from '@material-ui/icons/Help';

import { StartScreen, InstructionsScreen, JoinGameScreen, LobbyScreen, PlayingScreen, HostScreen } from './views';
import { Views } from './views/Views';

import { CurViewContext, SocketContext, PlayerContext } from './contexts';
import { ConfirmDialog } from './components/ConfirmDialog';
import { HelpDialog } from './components/HelpDialog';

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
  return [Views.InstructionsScreen, Views.JoinGame, Views.Lobby, Views.PlayingScreen].includes(curView);
}
function shouldShowHelpButton(curView: Views) {
  return curView === Views.PlayingScreen;
}

export function App() {
  const classes = useStyles();
  const [curView, setCurView] = useContext(CurViewContext);
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);
  const [confirmLeaveGameOpen, setConfirmLeaveGameOpen] = useState<boolean>(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);

  const socket = useContext(SocketContext);
  const closeConfirmLeaveGameDialog = () => setConfirmLeaveGameOpen(false);
  const openConfirmLeaveGameDialog = () => setConfirmLeaveGameOpen(true);
  const onConfimLeaveGame = () => {
    closeConfirmLeaveGameDialog();
    leaveGame();
  };

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

  function onHomeButtonClicked() {
    switch (curView) {
      case Views.Lobby:
      case Views.PlayingScreen:
        openConfirmLeaveGameDialog();
        break;
      case Views.JoinGame:
      case Views.InstructionsScreen:
        setCurView(Views.StartScreen);
    }
  }
  function handleHelpDialogClose() {
    setHelpDialogOpen(false);
  }
  function openHelpDialog() {
    setHelpDialogOpen(true);
  }
  function leaveGame() {
    closeConfirmLeaveGameDialog();
    socket.emit('player-leave-room', { roomCode: playerInfo.roomCode });
    setCurView(Views.StartScreen);
  }
  return (
    <div className={classes.appConainer}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          {shouldShowHomeButton(curView) && (
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={onHomeButtonClicked}>
              <HomeIcon />
            </IconButton>
          )}
          <Box flexGrow={1}>
            <Typography variant="h5" noWrap align="center">
              Coup
            </Typography>
          </Box>
          {shouldShowHelpButton(curView) && (
            <IconButton color="inherit" aria-label="help" edge="end" onClick={openHelpDialog}>
              <HelpIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <main className={classes.main}>
        {curView === Views.StartScreen && <StartScreen showHelpMenu={openHelpDialog} />}
        {curView === Views.InstructionsScreen && <InstructionsScreen />}
        {curView === Views.JoinGame && <JoinGameScreen />}
        {curView === Views.Lobby && <LobbyScreen />}
        {curView === Views.PlayingScreen && !playerInfo.isHost && <PlayingScreen />}
        {curView === Views.PlayingScreen && playerInfo.isHost && <HostScreen />}
      </main>
      <ConfirmDialog onClose={closeConfirmLeaveGameDialog} onConfirm={onConfimLeaveGame} open={confirmLeaveGameOpen}>
        Are you sure you want to leave the current game?
      </ConfirmDialog>
      <HelpDialog open={helpDialogOpen} handleClose={handleHelpDialogClose} />
    </div>
  );
}
