import React, { useEffect } from 'react'
import * as d3 from 'd3';
import * as d3_cloud from 'd3-cloud';

function Chart(props) {
  const width = 800;
  const height = 800;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const marginSparkLine = 10;
  const fontSizeMax = 30;
  const transitionMax = 1000;

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

  drawTreemap(props.data[props.index]);

  function drawTreemap(data) {
    const data_reduced = {
      word: data.word,
      children: data.children
        .map((d) => {
          return {
            word: d.word,
            size: d3.sum(d.children, (c) => Math.abs(c.size))
          }
        })
    };

    const root = d3.hierarchy(data_reduced);
    root.sum((d) => d.size);

    const treemap = d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true);

    treemap(root);

    const updateRect = svg.select("g#treemap").selectAll("rect")
      .data(root.leaves());

    const enterRect = updateRect
      .enter().append("rect")
      .attr("class", "rect");

    enterRect.merge(updateRect)
      .transition(1000)
      .attr("transform", function(d) {
        return "translate(" + d.x0 + "," + (d.y0) + ")";
      })
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .style("fill", (_, i) => d3.schemeCategory10[i])
      .style("opacity", 0.6)
      .each((d, i) => {
        drawWordCloudFromTreemap(data, d, i);
      });
  }

  function drawWordCloudFromTreemap(data, treeMapData, groupIndex) {
    const targetData = data.children[groupIndex]
      .children.map((d) => {
      return {
        text: d.word,
        size: d.size
      }
    });

    const treeMapWidth = treeMapData.x1 - treeMapData.x0;
    const treeMapHeight = treeMapData.y1 - treeMapData.y0;
    const layout = d3_cloud()
      .size([treeMapWidth, treeMapHeight])
      .words(targetData)
      .padding(marginSparkLine * 2)
      .rotate(0)
      .fontSize((d) => {
        return d3.min([d.size, fontSizeMax]);
      })
      .on("end", draw);

    const targetId = "g#" + treeMapData.data.word;

    svg.select("g#treemap").selectAll(targetId)
      .data(treeMapData)
      .enter().append("g")
      .attr("id", treeMapData.data.word)
      .attr("width", treeMapWidth)
      .attr("height", treeMapHeight)
      .attr("transform",
          "translate(" + (treeMapData.x0 + treeMapWidth/2) + "," + (treeMapData.y0 + treeMapHeight/2) + ")");

    layout.start();

    function draw(words) {
      const updateText = svg.select("g#treemap").selectAll(targetId).selectAll("text")
        .data(words);

      const enterText = updateText
        .enter().append("text");

      enterText.merge(updateText)
        .transition(transitionMax)
        .style("font-size", function (d) {
          return d3.min([d.size, fontSizeMax]).toString() + "px";
        })
        .attr("fill", (d) => d3.schemeCategory10[groupIndex])
        .attr("text-anchor", "middle")
        .style("font-family", "Impact")
        .attr("transform", function (d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
       .text((d) => d.text);

       const updateLineChart =   svg.select("g#treemap").selectAll(targetId).selectAll("g.lineChart")
         .data(words);
       const enterLineChart = updateLineChart
         .enter().append("g")
         .attr("class", "lineChart");

       enterLineChart
         .append("path")
         .attr("class", "timeSeries");

       const merged = enterLineChart.merge(updateLineChart);

       merged
         .transition(transitionMax)
         .attr("transform", function (d) {
           return "translate(" + [d.x + marginSparkLine, d.y + marginSparkLine]
            + ")rotate(" + d.rotate + ")";
         })
         .each((d, i, node) => {
           const timeSeries = props.data.map(
             (v) => v.children[groupIndex].children[i]
           );
           drawCircles(node[i], timeSeries, groupIndex);
         });

    }

    function drawCircles(node, timeSeries, groupIndex) {
      const xScale = d3.scaleLinear()
        .domain([0, timeSeries.length])
        .range([0, 50]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(timeSeries, (t) => t.size)])
        .range([5 * timeSeries.length, 0]);

      d3.select(node).select("path")
        .datum(timeSeries)
        .attr("fill", "none")
        .attr("stroke", d3.schemeCategory10[groupIndex])
        .attr("stroke-width", 1)
        .attr("d", d3.line()
          .x((_, i) => xScale(i))
          .y((t) => yScale(t.size))
        );

      const updateCircle = d3.select(node)
        .selectAll("circle.currentNode")
        .data(timeSeries);

      const enterCircle = updateCircle
        .enter().append("circle")
        .attr("class", "currentNode");

      enterCircle.merge(updateCircle)
        .transition(transitionMax)
        .attr("fill", (_, i) =>
          (i === timeSeries.length - 1)? "orange": d3.schemeCategory10[groupIndex]
        )
        .attr("r", (_, i) =>
          (i === timeSeries.length - 1)? 2: 1
        )
        .attr("stroke", "black")
        .attr("stroke-width", (_, i) =>
          (i === timeSeries.length - 1)? 1: 0
        )
        .attr("cx", (_, i) => xScale(i))
        .attr("cy", (t) => yScale(t.size));
    }

  }

  useEffect(() => {
    drawTreemap(props.data[props.index]);
  });

  return (
    <svg
      style={{ width: width, height: height }}
    >
      <g id="treemap"> </g>
    </svg>
  );
}
export default Chart;
