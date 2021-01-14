import React, { useEffect, useState } from 'react'
import * as d3 from 'd3';
import * as d3_cloud from 'd3-cloud';

function Chart(props) {
  const width = 800;
  const height = 800;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };

  function createChart(data) {
    const svg = d3.select("svg").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

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
     svg
      .append("g")
      .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
       .selectAll("text")
       .data(words)
       .enter().append("text")
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
    createChart(props.data);
  });

  return (
    <svg
      style={{ width: width, height: height }}
    ></svg>
  );
}
export default Chart;
