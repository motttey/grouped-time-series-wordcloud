import React, { useEffect } from 'react'
import * as d3 from 'd3';

function Chart(props) {
  const width = 800;
  const height = 800;
  const timelineHeight = 100;

  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const marginSparkLine =  5;
  const fontSizeMin = 12;
  const fontSizeMax = 24;
  const strokeWidth = 4;
  const lineChartSize = 75;
  const transitionMax = (props.index > 0)? 500: 0;
  const maxLabelLength = 8;

  const chartSegmentLength = Math.ceil(props.data.length / 5);

  const timelineSvg = d3.select("svg#timelineSvg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", timelineHeight);

  timelineSvg.select("g#timeline")
    .style("width", width)
    .style("height", height);

  const timeStampList = Object.keys(props.data);
  drawTimeLine(timeStampList);

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
    .style("height", height);

  function drawTimeLine(timeStampList) {
    const xScale = d3.scaleLinear()
      .domain([0, timeStampList.length])
      .range([margin.right, width - margin.left]);

    const nodeRadius = 10;

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
      .on("click", (event, d) => {
        props.updateIndex(timeStampList.indexOf(d));
      });

    // ラベルを追加
    timelineSvg
      .select("g#timeline")
      .selectAll("text")
      .data(timeStampList)
      .enter()
      .append("text")
      .style("font-size", "10px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .style("font-family", "Impact")
      .attr("transform", (d, i) => {
        return "translate("
          + [ xScale(i), timelineHeight/2 - nodeRadius * 2 ]
          + ")rotate(" + 0 + ")";
      })
      .text((d) => {
        return props.data[d]["word"]
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
  }

  function drawTreemap(data) {
    const root = d3.hierarchy(data);
    root.sum((d) => d.size);

    const treemap = d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true);

    treemap(root);

    const parentNames = data.children.map((d) => d.word);
    const childLeaves = root.leaves();

    const updateRect = svg.select("g#treemap").selectAll("rect")
      .data(root);

    const enterRect = updateRect
      .enter().append("rect")
      .attr("class", "rect");

    enterRect.merge(updateRect)
      .transition()
      .duration(transitionMax)
      .attr("transform", function(d) {
        return "translate(" + d.x0 + "," + (d.y0) + ")";
      })
      .attr("width", (d) => d.x1 - d.x0 - strokeWidth)
      .attr("height", (d) => d.y1 - d.y0 - strokeWidth)
      .style("fill", "#333333")
      .style("stroke", (d, i) =>  {
        return (d.depth <= 1)
         ? d3.schemeCategory10[parentNames.indexOf(d.data.word)]
         : "none";
      })
      .style("stroke-width", (strokeWidth).toString() + "px")
      .style("opacity", (d) => {
        return (d.depth <= 1)? 1 : 0;
      })

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
      .attr("fill", (d) => d3.schemeCategory10[
        parentNames.indexOf(d.parent.data.word)
      ])
      .attr("text-anchor", "middle")
      .style("font-family", "Impact")
      .attr("transform", function (d) {
        return "translate("
          + [ d.x0 + (d.x1 - d.x0) / 2 - marginSparkLine,
              d.y0 + (d.y1 - d.y0) / 2 - marginSparkLine ]
          + ")rotate(" + 0 + ")";
      })
      .text((d) => {
        return (d.data.word.length < maxLabelLength)? d.data.word
          : d.data.word.slice(0, maxLabelLength - 1) + '...'
      })
      .each((d, i) => {
        const parent = d.parent.data.word;
        const groupSeries = props.data.map(
          (v) => v.children[parentNames.indexOf(parent)]
        )
        .map(
          (v) => v.children.find((e) => e.word === d.data.word)
        );
        drawLinechart(d, groupSeries, parentNames, parent);
      });
  }

  function drawLinechart (treeMapData, timeSeries, parentNames, parent) {
    const targetId = "g#" + parent + "-" + treeMapData.data.code;
    const treeMapWidth = treeMapData.x1 - treeMapData.x0;
    const treeMapHeight = treeMapData.y1 - treeMapData.y0;

    svg.select("g#treemap").selectAll(targetId)
      .data(treeMapData)
      .enter().append("g")
      .attr("id", parent + "-" + treeMapData.data.code)
      .attr("width", treeMapWidth)
      .attr("height", treeMapHeight)
      .attr("transform",
          "translate("
          + (treeMapData.x0 + treeMapWidth/2) + ","
          + (treeMapData.y0 + treeMapHeight/2) + ")");

    const updateLineChart = svg.select("g#treemap").selectAll(targetId)
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
      .domain([0, d3.max(timeSeries, (t) => t.close)])
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
      .attr("stroke", d3.schemeCategory10[groupIndex])
      .attr("stroke-width", 0.5)
      .attr("d", d3.line()
        .x((_, i) => xScale(i))
        .y((t) => yScale(t.close))
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
        (i === props.index)? "orange": d3.schemeCategory10[groupIndex]
      )
      .attr("r", (_, i) =>
        (i === props.index)? 4: 3
      )
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("opacity", (_, i) =>
        (i === props.index
          || i === timeSeries.length - 1
          || i % chartSegmentLength === 0
        )? 1: 0
      )
      .attr("cx", (_, i) => xScale(i))
      .attr("cy", (t) => yScale(t.close));

    merged.selectAll("circle.currentNode")
      .on("click", (event, d) => {
        props.updateIndex(timeSeries.indexOf(d));
      })
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .attr("stroke", "red")
          .attr("stroke-width", 2);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .attr("stroke", "black")
          .attr("stroke-width", 1);
      });
  }

  useEffect(() => {
    if (props.data[props.index]) {
      drawTreemap(props.data[props.index]);
      // タイムラインの色を更新する
      timelineSvg
        .select("g#timeline")
        .selectAll("circle")
        .attr("stroke", (d) => {
          return (timeStampList.indexOf(d) === props.index)?
            "red" : "white";
        });
    }
  });

  return (
    <div>
      <svg id="timelineSvg" style={{ width: width, height: timelineHeight }}>
        <g id="timeline"> </g>
      </svg>
      <svg id="treemapSvg" style={{ width: width, height: height }}>
        <g id="treemap"> </g>
      </svg>
    </div>
  );
}
export default Chart;
