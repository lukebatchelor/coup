import React, { useState } from 'react';
import { Views } from '../views/Views';

type ContextType = [Views, (view: Views) => void];
const CurViewContext = React.createContext<ContextType>([Views.StartScreen, () => {}]);

const CurViewProvider: React.FC = (props) => {
  const [curView, setCurView] = useState<Views>(Views.StartScreen);

  return <CurViewContext.Provider value={[curView, setCurView]}>{props.children}</CurViewContext.Provider>;
};

export { CurViewContext, CurViewProvider };
