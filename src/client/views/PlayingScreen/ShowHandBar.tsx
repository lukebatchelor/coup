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
} from '@material-ui/core';

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
}));

type ShowHandBarProps = {
  openHandDrawer: () => void;
};
export function ShowHandBar(props: ShowHandBarProps) {
  const classes = useStyles();
  const { openHandDrawer } = props;

  return (
    <AppBar position="fixed" color="primary" className={classes.appBar}>
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center">
          <Toolbar>
            <Button type="button" classes={{ root: classes.button }} onClick={openHandDrawer}>
              Show Hand
            </Button>
          </Toolbar>
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
  cards: Array<CardInHand>;
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
    console.log('idx', idx, 'selected', selected);
  };
  const handleOnClose = () => {
    // block closing drawer if we are selecting cards
    if (allowSelection > 0) return;
    closeHandDrawer();
  };
  const handleSubmitSelection = () => {
    onSelection(selected);
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
              const className = clsx(classes.card, { [classes.selected]: allowSelection && selected.includes(i) });
              return (
                <Box ml={1} mr={1} display="flex" alignItems="center" flexDirection="column" key={'cc' + i}>
                  <img src="/card.png" className={className} alt="card" onClick={() => onClick(i)} />
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
