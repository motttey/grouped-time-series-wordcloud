import logo from './logo.svg';
import './App.css';
import React, { Component } from 'react'
import Chart from './Chart'

function App() {
  const data = [
    { word: "A", size: 45},
    { word: "B", size: 34},
    { word: "D", size: 20}
  ]
  return (
    <div className="App">
      <div id="container">
        <h2>React D3.js line chart</h2>
        <Chart data={data} />
      </div>
    </div>
  );
}

export default App;
