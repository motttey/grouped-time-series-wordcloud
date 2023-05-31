import React, { useCallback, useMemo, useEffect, useState } from 'react'
import * as d3 from 'd3';

const width = 800;
const height = 800;

const margin = { top: 50, right: 50, bottom: 50, left: 50 };
const marginSparkLine =  5;
const fontSizeMin = 12;
const fontSizeMax = 24;
const lineChartSize = 75;
const timelineHeight = 100;
const maxLabelLength = 8;

function Chart(props) {
  const timelineSvg = d3.select("svg#timelineSvg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", timelineHeight);

  timelineSvg.select("g#timeline")
    .style("width", width)
    .style("height", height);

  const svg = d3.select("svg#treemapSvg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  svg.select("g#wordCloud")
    .style("width", width)
    .style("height", height);

  svg.select("g#treemap")
    .attr("transform",
        "translate(" + 0 + "," + 0 + ")")
    .style("width", width)
    .style("height", height + margin.bottom);

  const [data, setData] = useState([]);
  const [index, setIndex] = useState([]);
  useMemo(() => {
    const _data = props?.data || [];
    setData(_data)
  }, [props.data])

  useMemo(() => {
    const _index = props?.index || 0;
    setIndex(_index)
  }, [props.index])

  // タイムラインの描画
  const [timeStampList, setTimeStampList] = useState([])
  useEffect(() => {
    setTimeStampList(Object.keys(data));
  }, [data]);

  const [transitionMax, setTransitionMax] = useState(0)
  useEffect(() => {
    if (index > 0) {
      setTransitionMax(0)
    } else {
      setTransitionMax(500)
    }
  }, [index]);
  
  const [specificTimeData, setSpecificTimeData] = useState({})
  useEffect(() => {
    if (data.length > index && data[index]) {
      setSpecificTimeData(data[index]);
    }
  }, [data, index]);

  const updateIndex = useCallback((index) => {
    props.updateIndex(index)
  },[props])

  const drawTimeLine = useCallback((data, timeStampList) => {
    const xScale = d3.scaleLinear()
      .domain([0, timeStampList.length])
      .range([margin.right, width - margin.left]);

    const nodeRadius = 10;
    const timelineHeight = 100;
    const timelineSvg = d3.select("svg#timelineSvg")
    // ノードを作成
    timelineSvg
      .select("g#timeline")
      .selectAll("circle")
      .data(timeStampList)
      .enter()
      .append("circle")
      .attr("class", "timelineNode")
      .attr("fill", "white")
      .attr("r", nodeRadius)
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("cx", (_, i) => xScale(i))
      .attr("cy", timelineHeight/2)
      .on("click", (_event, d) => {
        updateIndex(timeStampList.indexOf(d));
      });

    // ラベルを追加
    timelineSvg
      .select("g#timeline")
      .selectAll("text")
      .data(timeStampList)
      .enter()
      .append("text")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("transform", (d, i) => {
        return "translate("
          + [ xScale(i), timelineHeight/2 - nodeRadius * 2 ]
          + ")rotate(" + 0 + ")";
      })
      .style("font-size", "10px")
      .style("font-family", "Impact")
      .text((d) => {
        return data[d]["word"]
          .split("T")[0]
          .split("-").slice(1).join("/");
      });

    timelineSvg
      .select("g#timeline")
      .append("line")
      .attr("stroke", "white")
      .attr("stroke-width", "2px")
      .attr("x1", xScale(timeStampList[0]))
      .attr("y1", timelineHeight/2)
      .attr("x2", xScale(timeStampList[timeStampList.length - 1]))
      .attr("y2", timelineHeight/2);
  }, [updateIndex])

  const drawLinechart = useCallback((
    treeMapData,
    timeSeries,
    parentNames,
    parent,
    chartSegmentLength
  ) => {
    if (!treeMapData || treeMapData.length === 0) return;
    if (!timeSeries || timeSeries.length === 0) return;
    if (!parentNames) return;
    if (!parent) return;

    const targetId = "g#" + parent + "-" + treeMapData.data.code;
    const treeMapWidth = treeMapData.x1 - treeMapData.x0;
    const treeMapHeight = treeMapData.y1 - treeMapData.y0;

    d3.select("svg#treemapSvg").select("g#treemap").selectAll(targetId)
      .data(treeMapData)
      .enter().append("g")
      .attr("id", parent + "-" + treeMapData.data.code)
      .attr("width", treeMapWidth)
      .attr("height", treeMapHeight)
      .attr("transform",
          "translate("
          + (treeMapData.x0 + treeMapWidth/2) + ","
          + (treeMapData.y0 + treeMapHeight/2) + ")"
      );

    const updateLineChart = d3.select("svg#treemapSvg").select("g#treemap").selectAll(targetId)
      .data(treeMapData);

    const enterLineChart = updateLineChart
      .enter().append("g")
      .attr("class", parent + "-" + treeMapData.data.code);

    const merged = enterLineChart.merge(updateLineChart);
    merged
      .transition()
      .duration(transitionMax)
      .attr("width", treeMapWidth)
      .attr("height", treeMapHeight)
      .attr("transform",
          "translate("
          + (treeMapData.x0 + treeMapWidth/2 - lineChartSize/2 + marginSparkLine) + ","
          + (treeMapData.y0 + treeMapHeight/2 + marginSparkLine) + ")");

    const groupIndex = parentNames.indexOf(parent);
    const xScale = d3.scaleLinear()
      .domain([0, timeSeries.length])
      .range([0, lineChartSize - 10]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timeSeries, (t) => t?.close)])
      .range([lineChartSize, 0]);

    const updateLine = merged
      .selectAll("path.timeSeries")
      .data(timeSeries);

    const enterLine = updateLine
      .enter().append("path")
      .attr("class", "timeSeries");

    updateLine.merge(enterLine)
      .datum(timeSeries)
      .transition(transitionMax)
      .attr("fill", "none")
      .attr("stroke", d3.interpolateCool(groupIndex/parentNames.length))
      .attr("stroke-width", 0.5)
      .attr("d", d3.line()
        .x((_, i) => xScale(i))
        .y((t) => yScale(t?.close))
      );

    const updateCircle = merged
      .selectAll("circle.currentNode")
      .data(timeSeries);

    const enterCircle = updateCircle
      .enter()
      .append("circle")
      .attr("class", "currentNode");

    enterCircle.merge(updateCircle)
      .transition(transitionMax)
      .attr("fill", (_, i) =>
        (i === index)? "orange": d3.interpolateCool(groupIndex/parentNames.length)
      )
      .attr("r", (_, i) =>
        (i === index)? 4: 3
      )
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("opacity", (_, i) =>
        (i === index
          || i === timeSeries.length - 1
          || i % chartSegmentLength === 0
        )? 1: 0
      )
      .attr("cx", (_, i) => xScale(i))
      .attr("cy", (t) => yScale(t?.close));

    merged.selectAll("circle.currentNode")
      .on("click", (_, d) => {
        updateIndex(timeSeries.indexOf(d));
      })
      .on("mouseover", (event) => {
        d3.select(event.currentTarget)
          .attr("stroke", "red")
          .attr("stroke-width", 2);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .attr("stroke", "black")
          .attr("stroke-width", 1);
      });

    const updateCurrentCloseText = merged
      .selectAll("text.currentCloseText")
      .data([timeSeries[index]]);

    const enterCurrentCloseText = updateCurrentCloseText
      .enter()
      .append("text")
      .attr("class", "currentCloseText");

    enterCurrentCloseText.merge(updateCurrentCloseText)
      .transition(transitionMax)
      .style("font-size", "10px")
      .attr("fill", "yellow")
      .attr("text-anchor", "middle")
      .attr("transform", () => {
        return "translate("
          + [ xScale(index),
              fontSizeMax ]
          + ")rotate(" + 0 + ")";
      })
      .text((d) => d?.close);
  },[transitionMax, index, updateIndex])

  const drawTreemap = useCallback((data, specificTimeData, transitionMax) => {
    if (!specificTimeData) return;
    if (!data) return;

    const strokeWidth = 1;
    const chartSegmentLength = Math.ceil(data.length / 5);

    const root = d3.hierarchy(specificTimeData)
      .sum((d) => d.size) 
      .sort((a, b) => {
        return b.total - a.total;
      })
      .eachBefore((d) => {
        // 各ノードの訪問前にインデックスを計算する
        d.index = d.parent ? d.parent.index + "." + d.parent.children.indexOf(d) : "0";
      });

    root.sum((d) => d.size);

    const treemap = d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true);

    treemap(root);

    const parentNames = specificTimeData.children?.map((d) => d.word) || [];
    const childLeaves = root.leaves();

    const svg = d3.select("svg#treemapSvg");
    const updateRect = svg.select("g#treemap").selectAll("rect")
      .data(root);

    const enterRect = updateRect
      .enter().append("rect")
      .attr("class", "rect");

    enterRect.merge(updateRect)
      .transition()
      .duration(transitionMax)
      .attr("transform", (d) => {
        return "translate(" + d.x0 + "," + (d.y0) + ")";
      })
      .attr("width", (d) => d.x1 - d.x0 - strokeWidth)
      .attr("height", (d) => d.y1 - d.y0 - strokeWidth)
      .style("stroke", (d) =>  {
         return d3.interpolateCool(parentNames.indexOf(d.data.word)/parentNames.length)
      })
      .style("stroke-width", (strokeWidth).toString() + "px")
      .style("opacity", (d) => {
        return (d.depth <= 1)? 1 : 0;
      });

    if (!childLeaves) return;
    const updateText = svg.select("g#treemap").selectAll("text")
      .data(childLeaves);

    const enterText = updateText
      .enter().append("text")
      .attr("class", "text");
    
    enterText.merge(updateText)
      .transition()
      .duration(transitionMax)
      .style("font-size", function (d) {
        return d3.min([d3.max([d.data.size, fontSizeMin]), fontSizeMax]).toString() + "px";
      })
      .attr("fill", (d) => {
         return d3.interpolateCool(parentNames.indexOf(d?.parent?.data?.word)/parentNames.length)
      })
      .attr("text-anchor", "middle")
      .style("font-family", "Impact")
      .attr("transform", function (d) {
        return "translate("
          + [ d.x0 + (d.x1 - d.x0) / 2 - marginSparkLine,
              d.y0 + (d.y1 - d.y0) / 2 - marginSparkLine ]
          + ")rotate(" + 0 + ")";
      })
      .text((d) => {
        return (d?.data?.word?.length < maxLabelLength)? d.data.word
          : d?.data?.word?.slice(0, maxLabelLength - 1) + '...'
      });
    
    childLeaves
      .forEach((d, _) => {
        const parent = d?.parent?.data?.word;
        const groupSeries = data
          .map(
            (v) => v?.children[parentNames.indexOf(parent)]
          )
          .map(
            (v) => v?.children.find((e) => e.word === d.data.word)
          );
        drawLinechart(d, groupSeries, parentNames, parent, chartSegmentLength);
      });
  }, [drawLinechart]); // 依存関係にdrawLineChartを追加

  useEffect(() => {
    drawTimeLine(data, timeStampList);
  }, [data, timeStampList, drawTimeLine]);

  useEffect(() => {
    drawTreemap(data, specificTimeData, transitionMax);
  }, [data, specificTimeData, transitionMax, drawTreemap]);

  useEffect(() => {
    const timeStampList = Object.keys(data);
    timelineSvg
    .select("g#timeline")
    .selectAll("circle")
    .attr("stroke", (d) => {
      return (timeStampList.indexOf(d) === index)?
        "red" : "white";
    });
  }, [data, index, timelineSvg]);

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
  );
}
export default Chart;
