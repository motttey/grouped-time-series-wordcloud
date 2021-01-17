import './App.css';
import React, { useState } from 'react'
import Chart from './Chart'
import useInterval from 'use-interval'
const rand_max = 20;

function App() {
  let data = {
    word: "All",
    children: [
      {
        word: "groupA",
        children: [
          { word: "A", size: 45},
          { word: "B", size: 34},
          { word: "C", size: 34},
          { word: "D", size: 20}
        ]
      },
      {
        word: "groupB",
        children: [
          { word: "A", size: 80},
          { word: "B", size: 34},
          { word: "C", size: 34},
          { word: "D", size: 20}
        ]
      }
    ]
  };

  const [ dataState, setDataState ] = useState(data);
  function getData() {
    return data.children.map((d) => {
      return {
        word: d.word,
        children: d.children.map((c) => {
          return {
            word: c.word,
            size: c.size + parseInt(Math.random() * rand_max) - rand_max/2
          }
        })
      }
    });
  }
  const interval = useInterval(function(){
    const newData = {
      word: "All",
      children: getData()
    }
    setDataState(newData);
  }, 2500);

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
