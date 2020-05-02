/*
  Cant export from the index file because it creates a circular dependency
 */
enum Views {
  StartScreen = 1,
  JoinGameScreen,
  HostGameScreen,
  LobbyScreen,
  PlayGameScreen,
  InstructionsScreen,
}

// Cant export enums in default exports
export { Views };
