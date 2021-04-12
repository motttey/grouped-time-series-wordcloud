import './App.css';
import React, { useState, useEffect } from 'react';
import Chart from './Chart';
// import useInterval from 'use-interval';

function getCompanyObject(company, median) {
  return {
    word: company.word,
    close: company.close,
    volume: company.volume,
    total: company.total,
    size: Math.sqrt(company.volume / median) * 10,
    code: company.code
  };
};

function getCompany(category) {
  const sorted = category.children.map((d) => d.volume).sort();
  return {
    word: category.word,
    children: category.children.map((company) => getCompanyObject(company, sorted[category.children.length - 1])),
  }
};

function getCategory(timestamp) {
  return {
    word: timestamp.word,
    children: timestamp.children.map((category) => getCompany(category)),
  }
};

function App() {
  /*
  const rand_max = 20;

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
  */

  const updateIndexFromChild = (index) => {
    setIndexState(index);
    setDataState(dataState);
  };

  const [ dataState, setDataState ] = useState([]);
  const [ indexState, setIndexState ] = useState(0);

  const initializeData = () => {
    fetch('https://vigorous-hamilton-7b091f.netlify.app/topix.json')
      .then((res) => {
        return res.json();
      }).then((json) => {
        const topixFormat = json.map((d) => getCategory(d));
        setDataState(topixFormat);
        setIndexState(topixFormat.length - 1);
      });
  }

  useEffect(()=>{
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /*
  useInterval(function(){
    // 時点が増えすぎるのを一旦抑制
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
          data={dataState}
          index={indexState}
          updateIndex={updateIndexFromChild}
        />
      </div>
    </div>
  );
}

export default App;
