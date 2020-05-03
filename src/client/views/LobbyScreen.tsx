import React, { useContext, useEffect, useState } from 'react';
import { makeStyles, Container, Typography, Box, Paper, Grid, Avatar, Button } from '@material-ui/core';
import { SocketContext, PlayerContext } from '../contexts';

const useStyles = makeStyles((theme) => ({
  paper: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
}));

type LobbyScreenProps = {};
export function LobbyScreen(props: LobbyScreenProps) {
  const classes = useStyles();
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);
  const socket = useContext(SocketContext);
  const [players, setPlayers] = useState<Array<User>>([]);

  const { roomCode, nickName, isHost } = playerInfo;

  // Will only be called on first render
  useEffect(() => {
    const joinRoomData: PlayerJoinRoomMessage = { roomCode, nickName, host: isHost };
    socket.emit('player-join-room', joinRoomData);
    socket.on('room-status', ({ roomCode, players }: RoomStatusMessage) => {
      console.log({ roomCode, players });
      setPlayers(players.filter((p) => !p.host));
    });
    socket.on('start-game', () => {
      setPlayerInfo({ inGame: true });
    });

    // make sure we clean up listeners to avoid memory leaks
    return function cleanUp() {
      socket.off('room-status');
    };
  }, []);

  const onAllPlayersReady = () => {
    socket.emit('all-players-ready', { roomCode });
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h5" align="center">
        Room Code: {roomCode}
      </Typography>
      <Typography variant="h5" align="center">
        Nick name: {nickName}
      </Typography>
      <Box mt={3}>
        <Paper className={classes.paper}>
          <Grid>
            {players.length === 0 && (
              <Box pt={3} pb={3}>
                <Typography>Waiting for players to join...</Typography>
              </Box>
            )}
            {players.map((player) => (
              <Box display="flex" flexDirection="row" alignItems="center" key={player.id}>
                <Avatar alt={player.nickName}>{player.nickName[0].toUpperCase()}</Avatar>
                <Box padding={3}>
                  <Typography variant="h6">{player.nickName}</Typography>
                </Box>
              </Box>
            ))}
          </Grid>
        </Paper>
        {isHost && (
          <Box mt={3}>
            <Button
              type="submit"
              disabled={players.length < 2}
              fullWidth
              variant="contained"
              color="primary"
              onClick={onAllPlayersReady}
            >
              All Players Ready
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}
