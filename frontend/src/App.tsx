import axios from 'axios';
import { useAppDispatch, useAppSelector } from './redux/main';
import { Waiting } from './screens/Waiting';
import { ScreenNameToComponentMapping } from './screens/main';
import * as React from "react"
import { URLBase } from './utils/URLBase';
import { setWaiting } from './redux/waiting';
import { displayPartsToString } from 'typescript';
import { setScreen } from './redux/screen';
function App() {
  const screen = useAppSelector(s=>s.screen);
  const Screen = ScreenNameToComponentMapping.get(screen)!;
  const waiting = useAppSelector(s => s.waiting);

  return (
    <>
    {waiting && <Waiting />}
    <Screen />
    </>
);
}

export default App;