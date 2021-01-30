import React, { useEffect } from 'react'
import * as d3 from 'd3';

function Chart(props) {
  const width = 800;
  const height = 800;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const marginSparkLine =  5;
  const fontSizeMax = 100;
  const strokeWidth = 4;
  const transitionMax = (props.index > 0)? 500: 0;

  const svg = d3.select("svg")
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
      .attr("width", (d) => d.x1 - d.x0 - strokeWidth/2)
      .attr("height", (d) => d.y1 - d.y0 - strokeWidth/2)
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
        return d3.min([d.data.size, fontSizeMax]).toString() + "px";
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
      .text((d) => d.data.word)
      .each((d, i) => {
        const parent = d.parent.data.word;
        const groupSeries = props.data.map(
          (v) => v.children[parentNames.indexOf(parent)]
        )
        .map(
          (v) => v.children.find((e) => e.word === d.data.word)
        );
        if (d.data.size > fontSizeMax/2) drawLinechart(d, groupSeries, parentNames, parent);
      });
  }

  function drawLinechart (treeMapData, timeSeries, parentNames, parent) {
    const targetId = "g#" + parent + "-" + treeMapData.data.word;
    const treeMapWidth = treeMapData.x1 - treeMapData.x0;
    const treeMapHeight = treeMapData.y1 - treeMapData.y0;

    svg.select("g#treemap").selectAll(targetId)
      .data(treeMapData)
      .enter().append("g")
      .attr("id", parent + "-" + treeMapData.data.word)
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
      .attr("class", parent + "-" + treeMapData.data.word);

    const merged = enterLineChart.merge(updateLineChart);

    merged
      .transition()
      .duration(transitionMax)
      .attr("width", treeMapWidth)
      .attr("height", treeMapHeight)
      .attr("transform",
          "translate("
          + (treeMapData.x0 + treeMapWidth/2 + marginSparkLine) + ","
          + (treeMapData.y0 + treeMapHeight/2 + marginSparkLine) + ")");

    const groupIndex = parentNames.indexOf(parent);
    const xScale = d3.scaleLinear()
      .domain([0, timeSeries.length])
      .range([0, 50]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timeSeries, (t) => t.size)])
      .range([5 * timeSeries.length, 0]);

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
      .attr("stroke-width", 1)
      .attr("d", d3.line()
        .x((_, i) => xScale(i))
        .y((t) => yScale(t.size))
      );

    const updateCircle = merged
      .selectAll("circle.currentNode")
      .data(timeSeries);

    const enterCircle = updateCircle
      .enter().append("circle")
      .attr("class", "currentNode");

    enterCircle.merge(updateCircle)
      .transition(transitionMax)
      .attr("fill", (_, i) =>
        (i === props.index)? "orange": d3.schemeCategory10[groupIndex]
      )
      .attr("r", (_, i) =>
        (i === props.index)? 3: 2
      )
      .attr("stroke", "black")
      .attr("stroke-width", (_, i) =>
        (i === props.index)? 1: 0
      )
      .attr("cx", (_, i) => xScale(i))
      .attr("cy", (t) => yScale(t.size))

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
    if (props.data[props.index]) drawTreemap(props.data[props.index]);
  });

  return (
    <svg style={{ width: width, height: height }}>
      <g id="treemap"> </g>
    </svg>
  );
}
export default Chart;
