import React from 'react';
import { makeStyles, Container, Paper, Typography, Box, Grid, Button, Link } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
  },
}));

type InstructionsScreenProps = {};
export function InstructionsScreen(props: InstructionsScreenProps) {
  const classes = useStyles();

  return (
    <Container maxWidth="md">
      <Paper className={classes.paper}>
        <Typography variant="h6">Object of the game</Typography>
        <Typography paragraph>To eliminate the influence of all other players and be the last survivor.</Typography>

        <Typography variant="h6">Influence</Typography>

        <Typography paragraph>Facedown cards in front of a player represent who they influence at court.</Typography>

        <Typography paragraph>
          Every time a player loses an influence they have to turn over and reveal one of their face down cards.
        </Typography>

        <Typography paragraph>
          Revealed cards remain face up in front of the player visible to everyone and no longer provide influence for
          the player.
        </Typography>

        <Typography paragraph>
          Each player always chooses which of their own cards they wish to reveal when they lose an influence.
        </Typography>

        <Typography paragraph>
          When a player has lost all their influence they are exiled and are out of the game.
        </Typography>
      </Paper>
    </Container>
  );
}
