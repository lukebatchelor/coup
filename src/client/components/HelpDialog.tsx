import React from 'react';
import {
  makeStyles,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Slide,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Container,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { TransitionProps } from '@material-ui/core/transitions';

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'relative',
  },
  table: {
    maxWidth: '90%',
  },
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

const characterData = [
  { name: '', action: 'Income', effect: 'Take 1 coin', counteraction: '' },
  { name: '', action: 'Foreign Aid', effect: 'Take 2 coins', counteraction: '' },
  { name: '', action: 'Coup', effect: 'Pay 7 coins\nChoose player to lose influence', counteraction: '' },
  { name: 'Duke', action: 'Tax', effect: 'Take 3 coins', counteraction: 'Blocks Foreign Aid' },
  {
    name: 'Assassin',
    action: 'Assassinate',
    effect: 'Pay 3 coins\nChoose player to lose influence',
    counteraction: 'Blocks Foreign Aid',
  },
  {
    name: 'Ambassador',
    action: 'Exchange',
    effect: 'Draw 2 cards from the deck and put any 2 cards back',
    counteraction: 'Blocks Stealing',
  },
  { name: 'Captain', action: 'Steal', effect: 'Take 2 coins from another player', counteraction: 'Blocks Stealing' },
  { name: 'Contessa', action: '', effect: '', counteraction: 'Blocks Assassination' },
];

type HelpDialogProps = {
  handleClose: () => void;
  open: boolean;
};
export function HelpDialog(props: HelpDialogProps) {
  const classes = useStyles();
  const { handleClose, open } = props;

  return (
    <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
      <AppBar className={classes.appBar}>
        <Toolbar>
          <Box pr={6} />
          <Box flexGrow={1}>
            <Typography variant="h5" noWrap align="center">
              Coup Help
            </Typography>
          </Box>
          <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xs">
        <Box mb={2} />
        <Typography gutterBottom variant="h5">
          Playing the game
        </Typography>
        <Typography gutterBottom>Coup is a very simple game on the surface.</Typography>
        <Typography gutterBottom>The aim of of the game is to be the last player standing.</Typography>
        <Typography gutterBottom>
          Each player starts with two influence cards. Once these are revealed they are eliminated.
        </Typography>
        <Typography gutterBottom>
          <strong>Actions:</strong> during a player's turn they can play any of the actions listed in the table below.
          Some actions can then be blocked or challenged.
        </Typography>
        <Typography gutterBottom>
          <strong>Blocking:</strong> some influence cards allow you to Block another players action.
        </Typography>
        <Typography gutterBottom>
          <strong>Bluffing</strong> any player can claim to have an influence card to play an action, <i>however,</i>{' '}
          any other player can then "Challenge" the action requiring them to then "prove" they had the action card they
          claimed.
        </Typography>
        <Typography gutterBottom>
          <strong>Successful Challenges:</strong> if a player is caught bluffing, they must reveal an influence as
          punishment.
        </Typography>
        <Typography gutterBottom>
          <strong>Failed Challenges:</strong> if a player is challenged and they weren't bluffing, the challenging
          player must then reveal one of their own influences and the challenged player draws a new influence.
        </Typography>
        <Typography gutterBottom>
          <strong>Coup:</strong> Coup is a special action that cannot be blocked or challenged. If a player starts their
          turn with 10+ coins they must coup another player.
        </Typography>
        <Box mb={4} />
        <hr />
        <Box mb={4} />
        <Typography variant="h5">Character Cheet Sheet</Typography>
        <Table aria-label="Character Cheat Sheet">
          <TableHead>
            <TableRow>
              <TableCell align="center">Action</TableCell>
              <TableCell align="center">Effect</TableCell>
              <TableCell align="center">Counteraction</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {characterData.map((row) => (
              <TableRow key={row.name + '-' + row.action}>
                <TableCell align="center">
                  <strong>{row.name}</strong>
                  <br />
                  {row.action}
                </TableCell>

                <TableCell align="center">{row.effect}</TableCell>
                <TableCell align="center">{row.counteraction}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box mb={6} />
      </Container>
    </Dialog>
  );
}
