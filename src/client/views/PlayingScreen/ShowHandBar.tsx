import React, { useState } from 'react';
import clsx from 'clsx';
import {
  makeStyles,
  Container,
  AppBar,
  Box,
  Toolbar,
  ButtonGroup,
  Button,
  Typography,
  Drawer,
  GridList,
  Fab,
} from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { IconButton } from 'material-ui';
import { PlayerContext } from '../../contexts';
const useStyles = makeStyles((theme) => ({
  button: {
    color: 'white',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  appBar: {
    bottom: 0,
    top: 'auto',
  },
  card: {
    maxHeight: '140px',
    width: 'auto',
    // alignSelf: 'center',
  },
  selected: {
    filter: 'grayscale(80%)',
  },
  coin: {
    height: theme.spacing(5),
    width: theme.spacing(5),
  },
  fabButton: {
    position: 'absolute',
    zIndex: 1,
    top: -30,
    left: 0,
    right: 0,
    margin: '0 auto',
  },
  cardsIcon: {
    height: '90%',
    width: '90%',
    position: 'absolute',
  },
}));

type ShowHandBarProps = {
  openHandDrawer: () => void;
  coins: number;
  playerName: string;
};
export function ShowHandBar(props: ShowHandBarProps) {
  const classes = useStyles();
  const { openHandDrawer, coins, playerName } = props;

  return (
    <AppBar position="fixed" color="primary" className={classes.appBar}>
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center">
          <Toolbar style={{ width: '100%' }}>
            <Typography>{playerName || ''}</Typography>
            <Fab aria-label="Show hand" className={classes.fabButton} onClick={openHandDrawer}>
              <img src="cardsIcon.png" alt="Show hand" className={classes.cardsIcon} />
            </Fab>
            <Box display="flex" flexDirection="row" alignItems="center" ml="auto">
              <img src="coin.png" className={classes.coin}></img>
              <Typography>{coins}</Typography>
            </Box>
          </Toolbar>
          {/* <Box position="absolute"></Box> */}
        </Box>
      </Container>
    </AppBar>
  );
}

type ShowHandDrawerProps = {
  open: boolean;
  closeHandDrawer: () => void;
  allowSelection: number;
  onSelection: (selected: Array<number>) => void;
  cards: Array<Omit<CardInHand, 'replacing'>>;
};
export function ShowHandDrawer(props: ShowHandDrawerProps) {
  const classes = useStyles();
  const { open, closeHandDrawer, onSelection, allowSelection, cards } = props;
  const [selected, setSelected] = useState<Array<number>>([]);

  const onClick = (idx: number) => {
    if (allowSelection > 1) {
      if (selected.includes(idx)) {
        setSelected(selected.filter((num) => num !== idx));
      } else {
        setSelected([...selected, idx]);
      }
    } else if (allowSelection === 1) {
      onSelection([idx]);
      closeHandDrawer();
    }
  };
  const handleOnClose = () => {
    // block closing drawer if we are selecting cards
    if (allowSelection > 0) return;
    closeHandDrawer();
  };
  const handleSubmitSelection = () => {
    onSelection(selected);
    setSelected([]);
    closeHandDrawer();
  };
  const submitDisabled = selected.length !== allowSelection;
  const submitText = submitDisabled ? `${selected.length}/${allowSelection} selected` : 'Submit';

  return (
    <Drawer anchor="bottom" open={open} onClose={handleOnClose}>
      <Container maxWidth="sm">
        <Box>
          <Typography variant="h5" align="center" gutterBottom>
            Hand
          </Typography>
          <GridList cols={2} style={{ flexWrap: 'nowrap', transform: 'translateZ(0)' }}>
            {cards.map((card, i: number) => {
              const className = clsx(classes.card, {
                [classes.selected]: (allowSelection && selected.includes(i)) || card.flipped,
              });
              return (
                <Box ml={1} mr={1} display="flex" alignItems="center" flexDirection="column" key={'cc' + i}>
                  <img src={`/${card.card}.png`} className={className} alt={card.card} onClick={() => onClick(i)} />
                  <Typography align="center">{card.card}</Typography>
                </Box>
              );
            })}
          </GridList>
          {allowSelection > 1 && (
            <Box display="flex" justifyContent="center" mb={2}>
              <Button type="button" variant="contained" onClick={handleSubmitSelection} disabled={submitDisabled}>
                {submitText}
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Drawer>
  );
}
