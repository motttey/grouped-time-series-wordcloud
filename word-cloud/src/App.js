import './App.css';
import React, { Component, useState } from 'react'
import Chart from './Chart'
import useInterval from 'use-interval'
const rand_max = 20;

function App() {
  let data = [
    { word: "A", size: 45},
    { word: "C", size: 34},
    { word: "D", size: 20}
  ];

  const [ dataState, setDataState ] = useState(data);
  function getData() {
    return data.map((d) => {
      return {
        word: d.word,
        size: d.size + parseInt(Math.random() * rand_max) - rand_max/2
      }
    });
  }
  const interval = useInterval(function(){
    const newData = getData();
    console.log(newData);
    setDataState(newData);
  }, 1000);

  return (
    <div className="App">
      <div id="container">
        <h2>React D3.js line chart</h2>
        <Chart data={dataState} />
      </div>
    </div>
  );
}

export default App;
