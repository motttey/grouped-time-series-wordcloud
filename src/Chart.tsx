import { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import * as d3 from 'd3'
import { MarketDataNode as IMarketDataNode, StockItem } from './types/stock'

interface MarketDataNode extends IMarketDataNode {
  x0: number
  x1: number
  y0: number
  y1: number
  depth?: number
  volume?: number
  size?: number
}

interface Props {
  updateIndex: (index: number) => void
  data: Array<MarketDataNode>
  index: number
}

interface TextDatum {
  data?: {
    word: string
    [key: string]: any
  }
}

const width = 1000
const height = 800

const margin = { top: 50, right: 50, bottom: 50, left: 50 }
const marginSparkLine = 5
const fontSizeMin = 8
const fontSizeMax = 12
const lineChartSizeX = 50
const lineChartSizeY = 120
const maxLabelLength = 8
const topStockItemsNum = 30
const nodeRadius = 10
const timelineHeight = 100
const strokeWidth = 1

const fetchThemeColor = (d: string, arr: Array<string>) => {
  if (!d || arr.length === 0) return 'black'
  return d3.interpolateRainbow(arr.indexOf(d) / arr.length)
}

function Chart(props: Props) {
  const timelineSvgRef = useRef<d3.Selection<SVGSVGElement, undefined, null, undefined> | null>(null)
  const treemapSvgRef = useRef<d3.Selection<SVGSVGElement, undefined, null, undefined> | null>(null)

  const data = props?.data
  const index = props?.index

  // タイムラインの描画
  const [timeStampList, setTimeStampList] = useState<Array<string>>([])
  const [transitionMax, setTransitionMax] = useState<number>(0)
  const [specificTimeData, setSpecificTimeData] = useState<MarketDataNode>()

  useEffect(() => {
    timelineSvgRef.current = d3.select('svg#timelineSvg') as any
    treemapSvgRef.current = d3.select('svg#treemapSvg') as any
  }, [])

  useEffect(() => {
    setTimeStampList(Object.keys(data))
  }, [data])

  useEffect(() => {
    if (index > 0) {
      setTransitionMax(0)
    } else {
      setTransitionMax(500)
    }
  }, [index])

  useEffect(() => {
    if (data.length > index && data[index]) {
      setSpecificTimeData(data[index])
    }
  }, [data, index])

  const updateIndex = useCallback(
    (index: number) => {
      props.updateIndex(index)
    },
    [props],
  )

  const drawTimeLine = useCallback(
    (data: Array<MarketDataNode>, timeStampList: Array<string>) => {
      const xScale = d3
        .scaleLinear()
        .domain([0, timeStampList.length])
        .range([margin.right, width - margin.left])

      const timelineSvg = timelineSvgRef.current
      if (!timelineSvg) return
      // ノードを作成
      timelineSvg
        .select('g#timeline')
        .selectAll('circle')
        .data(timeStampList)
        .enter()
        .append('circle')
        .attr('class', 'timelineNode')
        .attr('fill', (_, i) => (i % 2 === 0 ? 'white' : 'none'))
        .attr('r', nodeRadius)
        .attr('stroke', 'none')
        .attr('stroke-width', (_, i) => (i % 2 === 0 ? 1 : 0))
        .attr('cx', (_, i) => xScale(i))
        .attr('cy', timelineHeight / 2)
        .style('pointer-events', (_, i) => (i % 2 === 0 ? 'visible' : 'none'))
        .on('click', (_event, d) => {
          updateIndex(timeStampList.indexOf(d))
        })

      // ラベルを追加
      timelineSvg
        .select('g#timeline')
        .selectAll('text')
        .data(timeStampList)
        .enter()
        .append('text')
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('transform', (_, i) => {
          return 'translate(' + [xScale(i), timelineHeight / 2 - nodeRadius * 2] + ')rotate(' + 0 + ')'
        })
        .style('font-size', '10px')
        .style('font-weight', 'Impact')
        .style('opacity', (_, i) => (i % 2 === 0 ? 1 : 0))
        .style('pointer-events', (_, i) => (i % 2 === 0 ? 'visible' : 'none'))
        .text((d: any) => {
          return data[d]['word'].split('T')[0].split('-').slice(1).join('/')
        })

      timelineSvg
        .select('g#timeline')
        .append('line')
        .attr('stroke', 'white')
        .attr('stroke-width', '2px')
        .attr('x1', xScale(timeStampList[0] as any))
        .attr('y1', timelineHeight / 2)
        .attr('x2', xScale(timeStampList[timeStampList.length - 1] as any))
        .attr('y2', timelineHeight / 2)
    },
    [updateIndex],
  )

  const drawLinechart = useCallback(
    (
      treeMapData: d3.HierarchyNode<any>,
      timeSeries: Array<StockItem | undefined>,
      parentNames: Array<string>,
      parent: string,
      chartSegmentLength: number,
    ) => {
      if (!treeMapData || treeMapData.length === 0) return
      if (!timeSeries || timeSeries.length === 0) return
      if (!parentNames) return

      const targetId = 'g#' + parent + '-' + treeMapData.data.code
      const treeMapWidth: number = (treeMapData as any).x1 - (treeMapData as any).x0
      const treeMapHeight: number = (treeMapData as any).y1 - (treeMapData as any).y0

      const treemapSvg = treemapSvgRef.current
      if (!treemapSvg) return

      treemapSvg
        .select('g#treemap')
        .selectAll(targetId)
        .data(treeMapData as any)
        .enter()
        .append('g')
        .attr('id', parent + '-' + treeMapData.data.code)
        .attr('width', treeMapWidth)
        .attr('height', treeMapHeight)
        .attr(
          'transform',
          'translate(' +
            ((treeMapData as any).x0 + treeMapWidth / 2) +
            ',' +
            ((treeMapData as any).y0 + treeMapHeight / 2) +
            ')',
        )

      const updateLineChart = treemapSvg.select('g#treemap').selectAll(targetId).data(treeMapData)

      const enterLineChart = updateLineChart
        .enter()
        .append('g')
        .attr('class', parent + '-' + treeMapData.data.code)

      const merged = enterLineChart.merge(updateLineChart as any)
      merged
        .transition()
        .duration(transitionMax)
        .attr('width', treeMapWidth)
        .attr('height', treeMapHeight)
        .attr(
          'transform',
          'translate(' +
            (((treeMapData as any).x0 as any) + treeMapWidth / 2 - lineChartSizeX / 2 + marginSparkLine) +
            ',' +
            (((treeMapData as any).y0 as any) + treeMapHeight / 2 + marginSparkLine) +
            ')',
        )

      const xScale = d3
        .scaleLinear()
        .domain([0, timeSeries.length])
        .range([0, lineChartSizeX - 10])

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(timeSeries, (t: any) => t.close)])
        .range([lineChartSizeY, 0])

      const updateLine = merged.selectAll('path.timeSeries').data(timeSeries)

      const enterLine = updateLine.enter().append('path').attr('class', 'timeSeries')

      updateLine
        .merge(enterLine as any)
        .datum(timeSeries)
        .transition(transitionMax as any)
        .attr('fill', 'none')
        .attr('stroke', fetchThemeColor(parent, parentNames))
        .attr('stroke-width', 0.5)
        .attr(
          'd',
          (d3.line() as any)
            .x((_: any, i: number) => xScale(i))
            .y((t: StockItem) => (t ? yScale(t.close as number) : 0)),
        )

      const updateCircle = merged.selectAll('circle.currentNode').data(timeSeries)

      const enterCircle = updateCircle.enter().append('circle').attr('class', 'currentNode')

      enterCircle
        .merge(updateCircle as any)
        .transition(transitionMax as any)
        .attr('fill', (_, i) => (i === index ? 'orange' : fetchThemeColor(parent, parentNames)))
        .attr('r', (_, i) => (i === index ? 4 : 3))
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('opacity', (_, i) => (i === index || i === timeSeries.length - 1 || i % chartSegmentLength === 0 ? 1 : 0))
        .attr('cx', (_, i) => xScale(i))
        .attr('cy', (t) => yScale((t as StockItem).close))

      merged
        .selectAll('circle.currentNode')
        .on('click', (_, d) => {
          updateIndex(timeSeries.indexOf(d as StockItem))
        })
        .on('mouseenter', (event, d) => {
          const correspondingText = d3
            .select(event.currentTarget.parentNode.parentNode)
            .selectAll('text')
            .filter((textData) => (textData as TextDatum)?.data?.word === (d as StockItem).word)
          correspondingText.style('visibility', 'visible')
        })
        .on('mouseleave', (event, d) => {
          const correspondingText = d3
            .select(event.currentTarget.parentNode.parentNode)
            .selectAll('text')
            .filter((textData) => (textData as TextDatum)?.data?.word === (d as StockItem).word)
          correspondingText.style('visibility', 'hidden')
        })

      const updateCurrentCloseText = merged.selectAll('text.currentCloseText').data([timeSeries[index]])

      const enterCurrentCloseText = updateCurrentCloseText.enter().append('text').attr('class', 'currentCloseText')

      enterCurrentCloseText
        .merge(updateCurrentCloseText as any)
        .transition(transitionMax as any)
        .style('font-size', '10px')
        .attr('fill', 'yellow')
        .attr('text-anchor', 'middle')
        .attr('transform', () => {
          return 'translate(' + [xScale(index), fontSizeMax] + ')rotate(' + 0 + ')'
        })
        .text((d: any) => d?.close)
    },
    [transitionMax, index, updateIndex],
  )

  const drawTreemap = useCallback(
    (data: Array<MarketDataNode>, specificTimeData: MarketDataNode | undefined, transitionMax: number) => {
      if (!specificTimeData) return
      if (!data) return

      // チャートの中に何個点を描画するか
      const chartSegmentLength = Math.ceil(data.length / 1.5)

      const root: d3.HierarchyNode<MarketDataNode> = d3
        .hierarchy(specificTimeData)
        .sum((d: MarketDataNode) => d.size || 0)
        .sort((a, b) => {
          return (a.data.volume || 0) - (b.data.volume || 0)
        })
        .eachBefore((d: any) => {
          // 各ノードの訪問前にインデックスを計算する
          d.index = d.parent ? d.parent.index + '.' + d.parent.children.indexOf(d) : '0'
        })

      root.sum((d) => d.size || 0)

      d3.treemap().size([width, height]).padding(1).round(true)(root as any)

      const parentNames = specificTimeData.children?.map((d) => d.word) || []

      // Sort childLeaves by volume
      const childLeaves = root
        .leaves()
        .sort(
          (a: d3.HierarchyNode<MarketDataNode>, b: d3.HierarchyNode<MarketDataNode>) =>
            (b.data?.volume ?? 0) - (a.data?.volume ?? 0),
        )

      const treemapSvg = treemapSvgRef.current
      if (!treemapSvg) return
      const updateRect = treemapSvg.select('g#treemap').selectAll('rect').data(root)

      const enterRect = updateRect.enter().append('rect').attr('class', 'rect') as any

      enterRect
        .merge(updateRect)
        .transition()
        .duration(transitionMax)
        .attr('transform', (d: MarketDataNode) => {
          return 'translate(' + d.x0 + ',' + d.y0 + ')'
        })
        .attr('width', (d: MarketDataNode) => d.x1 - d.x0 - strokeWidth)
        .attr('height', (d: MarketDataNode) => d.y1 - d.y0 - strokeWidth)
        .style('stroke', (d: TextDatum) => {
          return fetchThemeColor(d?.data?.word || '', parentNames)
        })
        .style('stroke-width', strokeWidth.toString() + 'px')
        .style('opacity', (d: MarketDataNode) => {
          return d.depth || 0 <= 1 ? 1 : 0
        })

      const allStockItems = specificTimeData.children.reduce(
        (acc: StockItem[], category) => acc.concat(category.children),
        [],
      )
      allStockItems.sort((a, b) => b.volume - a.volume)
      const topStockItems = allStockItems.slice(0, topStockItemsNum)

      if (!childLeaves) return
      const updateText = treemapSvg.select('g#treemap').selectAll('text').data(childLeaves)

      const enterText = updateText.enter().append('text').attr('class', 'text')

      const text = enterText.merge(updateText as any)

      text
        .transition()
        .duration(transitionMax)
        .style('font-size', (d: any) => {
          return d3.min([d3.max([d.data.size, fontSizeMin]), fontSizeMax]).toString() + 'px'
        })
        .attr('fill', (d) => {
          return fetchThemeColor(d?.parent?.data?.word || '', parentNames)
        })
        .attr('text-anchor', 'middle')
        .style('font-weight', 700)
        .attr('transform', (d: any) => {
          return (
            'translate(' +
            [d.x0 + (d.x1 - d.x0) / 2 - marginSparkLine, d.y0 + (d.y1 - d.y0) / 2 - marginSparkLine] +
            ')rotate(' +
            0 +
            ')'
          )
        })
        .text((d) => {
          return d?.data?.word?.length < maxLabelLength
            ? d.data.word
            : d?.data?.word?.slice(0, maxLabelLength - 1) + '...'
        })

      text.style('visibility', (d: any) => {
        return !topStockItems.some((item) => item.word === d.data.word) ? 'hidden' : 'visible'
      })

      childLeaves.forEach((d, _) => {
        const parent = d?.parent?.data?.word
        if (parent) {
          const groupSeries = data
            .map((v) => v?.children[parentNames.indexOf(parent)])
            .map((v) => v?.children.find((e) => e.word === d.data.word))
          drawLinechart(d as any, groupSeries, parentNames, parent, chartSegmentLength)
        }
      })
    },
    [drawLinechart],
  )

  useEffect(() => {
    drawTimeLine(data, timeStampList)
  }, [data, timeStampList, drawTimeLine])

  useEffect(() => {
    drawTreemap(data, specificTimeData, transitionMax)
  }, [data, specificTimeData, transitionMax, drawTreemap])

  useEffect(() => {
    const timeStampList = Object.keys(data)
    if (timelineSvgRef.current) {
      timelineSvgRef.current
        .select('g#timeline')
        .selectAll('circle')
        .attr('stroke', (d) => {
          return timeStampList.indexOf(d as string) === index ? 'red' : 'white'
        })
    }
  }, [data, index])

  return (
    <div>
      <div id="timeline_container">
        <svg id="timelineSvg" style={{ width: width, height: timelineHeight }}>
          <g id="timeline"> </g>
        </svg>
      </div>
      <div id="treemap_container">
        <svg id="treemapSvg" style={{ width: width, height: height }}>
          <g id="treemap"> </g>
        </svg>
      </div>
    </div>
  )
}

export default Chart
