import React, { useContext } from 'react';
import { makeStyles, Container, Paper, Typography, Box, Grid, Button, Link } from '@material-ui/core';
import { Views } from './Views';
import { CurViewContext, SocketContext, PlayerContext } from '../contexts';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
  },
}));

type StartScreenProps = {
  showHelpMenu: () => void;
};
export function StartScreen(props: StartScreenProps) {
  const classes = useStyles();
  const { showHelpMenu } = props;
  const [curView, setCurView] = useContext(CurViewContext);
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);
  const socket = useContext(SocketContext);

  const setViewHostGame = () => {
    socket.emit('create-room');
    socket.on('room-created', (message) => {
      socket.off('room-created');
      setPlayerInfo({ roomCode: message.roomCode, nickName: 'Host', isHost: true });
      setCurView(Views.Lobby);
    });
  };
  const setViewJoinGame = () => {
    setPlayerInfo({ isHost: false });
    setCurView(Views.JoinGame);
  };
  const onInstructionsClick = () => {
    showHelpMenu();
  };

  return (
    <Container maxWidth="md">
      <Paper className={classes.paper}>
        <Typography paragraph>
          In a future where the government is run for profit, all but a privledged few live lives of poverty and
          desperation.
        </Typography>
        <Typography paragraph>
          Out of these opressed masses are sown the seeds of a rebellion that throws the government into chaos.
        </Typography>

        <Typography paragraph>
          Many see hope for a brighter future for the first time in their lives. Others see opportunity for absolute
          power.
        </Typography>

        <Typography paragraph>
          To take command, you must destroy the influence of your rivals and drive them into exile.
        </Typography>

        <Typography>See the instructions for more information on how to play the game</Typography>
      </Paper>
      <Box mt={3}>
        <Grid container justify="space-evenly">
          <Button type="button" variant="contained" color="primary" onClick={setViewHostGame}>
            Host a game
          </Button>
          <Button type="button" variant="contained" color="primary" onClick={setViewJoinGame}>
            Join a game
          </Button>
        </Grid>
      </Box>
    </Container>
  );
}
