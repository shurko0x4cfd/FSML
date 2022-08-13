/* eslint-disable */

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { FSMLConsole } from './App';
import reportWebVitals from './reportWebVitals';


const container = document .getElementById ('root');
const root = createRoot (container);

root .render (<FSMLConsole />);


/*ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);*/

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
