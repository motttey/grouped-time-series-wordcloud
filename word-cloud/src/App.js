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
      },
      {
        word: "groupC",
        children: [
          { word: "A", size: 80},
          { word: "B", size: 34},
          { word: "C", size: 140}
        ]
      },
      {
        word: "groupD",
        children: [
          { word: "A", size: 67},
          { word: "B", size: 80},
        ]
      }
    ]
  };

  const getData = () => {
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
  };

  const increment = () => {
    setIndexState(indexState + 1)
  };

  const appendData = () => {
    dataState.push({
      word: "All",
      children: getData()
    });

    setDataState(dataState);
  };

  let allData = [
    {
      word: "All",
      children: getData()
    }
  ];

  const [ dataState, setDataState ] = useState(allData);
  const [ indexState, setIndexState ] = useState(0);

  useInterval(function(){
    // 時点が増えすぎるのをいったん抑制
    if (indexState > 10) return;
    appendData();
    increment();
  }, 3000);

  return (
    <div className="App">
      <div id="container">
        <h2>React D3.js line chart</h2>
        <Chart data={dataState} index={indexState} />
      </div>
    </div>
  );
}

export default App;
