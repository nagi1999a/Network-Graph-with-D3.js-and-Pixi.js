import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import Graph from './components/graph';
import * as serviceWorker from './serviceWorker';
import GraphControl from './components/graphControl'
ReactDOM.render(
  <React.StrictMode>
    <div>
      <h1 id="title">Drawing Network Graph with d3.js and pixi.js using React and Typescript</h1>
      <GraphControl/>
      <div style={{clear:"both"}} />
      {/* <Graph width={window.innerWidth*0.4} height={window.innerHeight*0.5} id="g1"/>
      <Graph width={window.innerWidth*0.4} height={window.innerHeight*0.5} id="g2"/> */}
    </div>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
