import './App.css';
import React, { useState, useEffect } from 'react';
import Chart from './Chart';
import useInterval from 'use-interval';
import topix from './topix';
const rand_max = 20;

function getCompanyObject(company) {
  return new Object({
    word: company.word,
    close: company.close,
    size: company.close / 100,
    code: company.code
  });
};

function getCompany(category) {
  return new Object({
    word: category.word,
    children: category.children.map((company) => getCompanyObject(company)),
  })
};

function getCategory(timestamp) {
  return new Object({
    word: timestamp.word,
    children: timestamp.children.map((category) => getCompany(category)),
  })
};

function App() {
  const topixFormat = topix.map((d) => getCategory(d));

  const data = {
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
          { word: "A2", size: 67},
          { word: "B2", size: 80},
          { word: "C2", size: 27},
          { word: "D2", size: 30},
          { word: "E2", size: 27},
          { word: "F2", size: 30},
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

  const updateIndexFromChild = (index) => {
    setIndexState(index);
    setDataState(dataState);
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

  let allData = [];
  const [ dataState, setDataState ] = useState([]);
  const [ indexState, setIndexState ] = useState(0);

  useEffect(()=>{
    setIndexState(topixFormat.length - 1);
    setDataState(topixFormat);
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  /*
  useInterval(function(){
    // 時点が増えすぎるのをいったん抑制
    if (dataState.length > 10) return;
    increment();
    appendData();
  }, 3000);
  */

  return (
    <div className="App">
      <div id="container">
        <h2>React D3.js line chart</h2>
        <Chart
          data={topixFormat}
          index={indexState}
          updateIndex={updateIndexFromChild}
        />
      </div>
    </div>
  );
}

export default App;
