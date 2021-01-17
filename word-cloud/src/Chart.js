import React, { useEffect } from 'react'
import * as d3 from 'd3';
import * as d3_cloud from 'd3-cloud';

function Chart(props) {
  const width = 600;
  const height = 400;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };

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

  drawTreemap(props.data);

  function drawTreemap(data) {
    const data_reduced = {
      word: data.word,
      children: data.children
        .map((d) => {
          return {
            word: d.word,
            size: d3.sum(d.children, function(c){
              return Math.abs(c.size);
            })
          }
        })
    };

    const root = d3.hierarchy(data_reduced);
    root.sum(function(d) { return d.size; });

    const treemap = d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true);

    treemap(root);

    /*
    const updateNode = svg.select("g#treemap")
      .selectAll("g.node")
      .data(root.leaves());

    const enterNode = updateNode
      .enter().append("g")
      .attr("class", "node");

    const g = enterNode.merge(updateNode)
      .transition(1000)
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + (d.y0) + ")"; });
    */

    const updateRect = svg.select("g#treemap").selectAll("rect")
      .data(root.leaves());

    const enterRect = updateRect
      .enter().append("rect")
      .attr("class", "rect");

    enterRect.merge(updateRect)
      .transition(1000)
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + (d.y0) + ")"; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .style("fill", function(d, i) {
        return d3.schemeCategory10[i];
      })
      .style("opacity", 0.6)
      .each((d, i) => {
        console.log(d);
        drawWordCloudFromTreemap(data, d, i);
      });
  }

  function drawWordCloudFromTreemap(data, treeMapData, index) {
    const targetData = data.children[index];
    const treeMapWidth = treeMapData.x1 - treeMapData.x0;
    const treeMapHeight = treeMapData.y1 - treeMapData.y0;

    const layout = d3_cloud()
      .size([treeMapWidth, treeMapHeight])
      .words(targetData.children.map(function (d) {
        return {
          text: d.word,
          size: d.size,
          color: "gray" };
        }
      ))
      .padding(5)
      .rotate(0)
      .fontSize(function (d) { return d.size; })
      .on("end", draw);

    const targetId = "g#" + treeMapData.data.word;
    const treeMapG = svg.select("g#word_cloud").selectAll(targetId)
      .data(treeMapData)
      .enter().append("g")
      .attr("id", treeMapData.data.word)
      .attr("transform",
          "translate(" + (treeMapData.x0 + treeMapWidth/2) + "," + (treeMapData.y0 + treeMapHeight/2) + ")");

    layout.start();

    function draw(words) {
      const updateText = svg.select("g#word_cloud").selectAll(targetId).selectAll("text")
        .data(words);

      const enterText = updateText
        .enter().append("text");

      enterText.merge(updateText)
        .transition(1000)
        .style("font-size", function (d) { return d.size; })
        .attr("fill", function (d) { return d.color;} )
        .attr("text-anchor", "middle")
        .style("font-family", "Impact")
        .attr("transform", function (d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
       .text(function (d) { return d.text; });
    }
  }

  function drawWordCloud(data) {
    const layout = d3_cloud()
      .size([width, height])
      .words(data.map(function (d) {
        return {
          text: d.word,
          size: d.size,
          color: "gray" };
        }
      ))
      .padding(5)
      .rotate(0)
      .fontSize(function (d) { return d.size; })
      .on("end", draw);

    layout.start();

    function draw(words) {
      const updateText = svg.select("g#word_cloud").selectAll("text")
        .data(words);

      const enterText = updateText
        .enter().append("text");

      enterText.merge(updateText)
        .transition(1000)
        .style("font-size", function (d) { return d.size; })
        .attr("fill", function (d) { return d.color;} )
        .attr("text-anchor", "middle")
        .style("font-family", "Impact")
        .attr("transform", function (d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
       .text(function (d) { return d.text; });
    }
  };

  useEffect(() => {
    drawTreemap(props.data);
  });

  return (
    <svg
      style={{ width: width, height: height }}
    >
      <g id="treemap"> </g>
      <g id="word_cloud"> </g>
    </svg>
  );
}
export default Chart;
