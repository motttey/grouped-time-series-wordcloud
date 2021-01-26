import React, { useEffect } from 'react'
import * as d3 from 'd3';
import * as d3_cloud from 'd3-cloud';

function Chart(props) {
  const width = 800;
  const height = 800;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const marginSparkLine =  5;
  const fontSizeMax = 100;
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
      .data(childLeaves);

    const enterRect = updateRect
      .enter().append("rect")
      .attr("class", "rect");

    enterRect.merge(updateRect)
      .transition()
      .duration(transitionMax)
      .attr("transform", function(d) {
        return "translate(" + d.x0 + "," + (d.y0) + ")";
      })
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .style("fill", (d, i) =>  {
        return d3.schemeCategory10[parentNames.indexOf(d.parent.data.word)];
      })
      .style("opacity", 0.6);

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
        drawLinechart(d, groupSeries, parentNames, parent);
      });
  }

  /*
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
        .transition()
        .duration(transitionMax)
        .style("font-size", function (d) {
          console.log(d);
          return d3.min([d.data.size, fontSizeMax]).toString() + "px";
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
         .transition()
         .duration(transitionMax)
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

    d3.select(node).selectAll("circle.currentNode")
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
  */

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
    drawTreemap(props.data[props.index]);
  });

  return (
    <svg style={{ width: width, height: height }}>
      <g id="treemap"> </g>
    </svg>
  );
}
export default Chart;
