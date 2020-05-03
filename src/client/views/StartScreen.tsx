import React, { useContext } from 'react';
import { makeStyles, Container, Paper, Typography, Box, Grid, Button, Link } from '@material-ui/core';
import { Views } from './Views';
import { CurViewContext, SocketContext, PlayerContext } from '../contexts';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
  },
}));

type StartScreenProps = {};
export function StartScreen(props: StartScreenProps) {
  const classes = useStyles();
  const [curView, setCurView] = useContext(CurViewContext);
  const [playerInfo, setPlayerInfo] = useContext(PlayerContext);
  const socket = useContext(SocketContext);

  const setViewHostGame = () => {
    socket.emit('create-room');
    socket.on('room-created', (message: RoomCreatedMessage) => {
      setPlayerInfo({ roomCode: message.roomCode, isHost: true });
      setCurView(Views.JoinGame);
    });
  };
  const setViewJoinGame = () => {
    setPlayerInfo({ isHost: false });
    setCurView(Views.JoinGame);
  };
  const onInstructionsClick = () => {
    setCurView(Views.InstructionsScreen);
  };

  return (
    <Container maxWidth="md">
      <Paper className={classes.paper}>
        <Typography paragraph>
          In the not too distant future, the government is run for profit by a new "royal class" of multinational CEOs.
        </Typography>

        <Typography paragraph>
          Their greed and absolute control of the economy has reduced all but a privileged few to lives of poverty and
          desperation.
        </Typography>

        <Typography paragraph>
          Out of the oppressed masses rose The Resistance, an underground organization focused on overthrowing these
          powerful rulers. The valiant efforts of
        </Typography>

        <Typography paragraph>
          The Resistance have created discord, intrigue, and weakness in the political courts of the noveau royal,
          bringing the government to brink of collapse. But for you, a powerful government official, this is your
          opportunity to manipulate, bribe and bluff your way into absolute power.
        </Typography>

        <Typography paragraph>
          To be successful, you must destroy the influence of your rivals and drive them into exile.
        </Typography>

        <Typography paragraph>In these turbulent times there is only room for one to survive.</Typography>

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
      <Box mt={3} textAlign="center">
        <Link href="#" variant="body2" onClick={onInstructionsClick}>
          {'Instructions'}
        </Link>
      </Box>
    </Container>
  );
}
