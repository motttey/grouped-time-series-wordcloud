import './App.css'
import { useState, useEffect } from 'react'
import Chart from './Chart'
import { CategoryNode, MarketDataNode, StockItem } from './types/stock'

const getCompanyObject = (company: StockItem, median: number) => {
  return {
    word: company.word,
    close: company.close,
    volume: company.volume,
    total: company.total,
    size: Math.sqrt(company.volume / median) * 10,
    code: company.code,
  }
}

const getCompany = (category: CategoryNode) => {
  const sorted = category.children.map((d) => d.volume).sort()
  return {
    word: category.word,
    children: category.children.map((company) => getCompanyObject(company, sorted[category.children.length - 1])),
  }
}

const getCategory = (timestamp: MarketDataNode) => {
  return {
    word: timestamp.word,
    children: timestamp.children.map((category) => getCompany(category)),
  }
}

const fetchApiEndpoint = 'https://grouped-time-series-wordcloud-api.netlify.app/topix.json'
function App() {
  const updateIndexFromChild = (index: number) => {
    setIndexState(index)
    setDataState(dataState)
  }

  const [dataState, setDataState] = useState([])
  const [indexState, setIndexState] = useState(0)

  useEffect(() => {
    fetch(fetchApiEndpoint)
      .then((res) => {
        return res.json()
      })
      .then((json) => {
        setDataState(json.map((d: MarketDataNode) => getCategory(d)))
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  useEffect(() => {
    setIndexState(dataState.length - 1)
  }, [dataState])

  return (
    <div className="App">
      <div id="container">
        <h2>React D3.js time-series word-cloud</h2>
        <Chart data={dataState} index={indexState} updateIndex={updateIndexFromChild} />
      </div>
    </div>
  )
}

export default App
