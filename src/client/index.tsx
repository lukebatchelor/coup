import React, { useState, useEffect } from 'react';
// @ts-ignore react-dom types seem to be super buggy, not importing them
import ReactDom from 'react-dom';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  makeStyles,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import HomeIcon from '@material-ui/icons/Home';
import {
  Views,
  StartScreen,
  JoinGameScreen,
  HostGameScreen,
  LobbyScreen,
  PlayGameScreen,
  InstructionsScreen,
} from './views';
import { initialiseSocket } from './sockets';

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
  return [
    Views.HostGameScreen,
    Views.JoinGameScreen,
    Views.LobbyScreen,
    Views.InstructionsScreen,
    Views.PlayGameScreen,
  ].includes(curView);
}

// function we can call to fetch all the images in the app to make sure they've
// been fetched before trying to render them
function preloadImages() {
  const images = [
    'dog_and_pwn.png',
    'bright_cats.png',
    'happy_otter.png',
    'penta_eagle.png',
    'sly_fox.png',
    'turtledove.png',
    'coin.png',
    'HostMode.png',
    'PlayerMode.png',
  ];
  images.forEach((img) => {
    const tmp = new Image();
    // No need to wait or add handlers, just load em
    tmp.src = process.env.BASE_URL + '/' + img;
  });
}

type HostMode = 'Host' | 'Player' | null;
type Player = { id: string; nickName: string };

export default function App() {
  const classes = useStyles();
  const [curView, setCurView] = useState<Views>(Views.StartScreen);
  const [hostMode, setHostMode] = useState<HostMode>(null);
  const [hostRoomCode, setHostRoomCode] = useState<string>(null);
  const [roomCode, setRoomCode] = useState<string>(null);
  const [nickName, setNickName] = useState<string>(null);
  const [playerId, setPlayerId] = useState<string>(null);
  const [confirmationOpen, setConfirmationOpen] = useState<boolean>(false);
  const [socket, setSocket] = useState<SocketIOClient.Socket>(null);

  const onWelcome = (welcomData: {
    id: string;
    nickName?: string;
    roomCode?: string;
    inGame?: boolean;
    hostMode?: HostMode;
  }) => {
    const { id, nickName, roomCode, inGame, hostMode } = welcomData;
    setPlayerId(id);
    localStorage.setItem('id', id);

    if (nickName) {
      setNickName(nickName);
    }
    if (roomCode) {
      setRoomCode(roomCode);
    }
    if (hostMode) {
      setHostMode(hostMode);
      setHostRoomCode(roomCode);
    }

    if (roomCode && !inGame) {
      setCurView(Views.LobbyScreen);
    } else if (roomCode && inGame) {
      setCurView(Views.PlayGameScreen);
    }
  };

  // On run on first render
  useEffect(() => {
    setSocket(initialiseSocket(onWelcome));
    preloadImages();
  }, []);

  const onConfirmPressed = () => {
    setConfirmationOpen(false);
    // simulate hitting home again, but with confirmation set to true
    onHomeButtonPressed(true);
  };
  const closeConfirmation = () => setConfirmationOpen(false);

  function onHomeButtonPressed(confirmed?: boolean) {
    if (curView === Views.JoinGameScreen) {
      setCurView(Views.StartScreen);
    }
    if (curView === Views.HostGameScreen) setCurView(Views.StartScreen);
    if (curView === Views.JoinGameScreen) setCurView(Views.StartScreen);
    if (curView === Views.LobbyScreen || curView === Views.PlayGameScreen) {
      if (confirmed) {
        socket.emit('player-leave-room', { roomCode });
        setCurView(Views.StartScreen);
        setRoomCode(null);
        setHostRoomCode(null);
      } else {
        setConfirmationOpen(true);
      }
    }
    if (curView === Views.InstructionsScreen) setCurView(Views.StartScreen);
  }
  const onHostModeChange = (hostMode: HostMode) => {
    setHostMode(hostMode);
    if (hostMode === 'Host') {
      setNickName('Host');
      setCurView(Views.LobbyScreen);
    }
    if (hostMode === 'Player') setCurView(Views.JoinGameScreen);
  };
  const onHostRoomCodeChange = (roomCode: string) => {
    // hostRoomCode is only used to override the users ability to set a room code
    // so that we can re-use the
    setHostRoomCode(roomCode);
    setRoomCode(roomCode);
  };
  const onJoinGame = (nickName: string, roomCode: string) => {
    setNickName(nickName);
    setRoomCode(roomCode);
    setCurView(Views.LobbyScreen);
  };
  const onStartGame = () => {
    setCurView(Views.PlayGameScreen);
  };
  const onInstructionsClick = () => {
    setCurView(Views.InstructionsScreen);
  };

  return (
    <div className={classes.appConainer}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          {shouldShowHomeButton(curView) && (
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={() => onHomeButtonPressed()}>
              <HomeIcon />
            </IconButton>
          )}
          <Box flexGrow={1}>
            <Typography variant="h5" noWrap align="center">
              Startups
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <main className={classes.main}>
        {curView === Views.StartScreen && (
          <StartScreen setCurView={setCurView} onInstructionsClick={onInstructionsClick} />
        )}
        {curView === Views.JoinGameScreen && <JoinGameScreen hostRoomCode={hostRoomCode} onJoinGame={onJoinGame} />}
        {curView === Views.HostGameScreen && (
          <HostGameScreen
            setCurView={setCurView}
            onHostModeChange={onHostModeChange}
            onHostRoomCodeChange={onHostRoomCodeChange}
          />
        )}
        {curView === Views.LobbyScreen && (
          <LobbyScreen nickName={nickName} roomCode={roomCode} hostMode={hostMode} onStartGame={onStartGame} />
        )}
        {curView === Views.PlayGameScreen && <PlayGameScreen playerId={playerId} />}
        {curView === Views.InstructionsScreen && <InstructionsScreen onDoneClicked={onHomeButtonPressed} />}
      </main>
      <Dialog
        open={confirmationOpen}
        onClose={closeConfirmation}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to leave the current game?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmation} color="primary">
            Cancel
          </Button>
          <Button onClick={onConfirmPressed} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

ReactDom.render(<App></App>, document.getElementById('root'));
