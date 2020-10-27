<template>
  <div></div>
</template>

<script>
import * as d3 from "d3";
export default {
  data() {
    return {
      data: Array,
    };
  },
  created() {
    this.renderChart();
  },
  methods: {
    renderChart() {
      const data = [
        { col1: "1-May-12", col2: 58.13, col3: 34.12 },
        { col1: "30-Apr-12", col2: 53.98, col3: 45.56 },
        { col1: "27-Apr-12", col2: 67.0, col3: 67.89 },
        { col1: "26-Apr-12", col2: 89.7, col3: 67.89 },
        { col1: "25-Apr-12", col2: 99.0, col3: 67.89 },
        { col1: "24-Apr-12", col2: 130.28, col3: 67.89 },
        { col1: "23-Apr-12", col2: 166.7, col3: 67.89 },
        { col1: "20-Apr-12", col2: 234.98, col3: 67.89 },
        { col1: "19-Apr-12", col2: 345.44, col3: 67.89 },
        { col1: "18-Apr-12", col2: 443.34, col3: 67.89 },
        { col1: "17-Apr-12", col2: 543.7, col3: 67.89 },
        { col1: "16-Apr-12", col2: 580.13, col3: 67.89 },
        { col1: "13-Apr-12", col2: 605.23, col3: 67.89 },
        { col1: "12-Apr-12", col2: 622.77, col3: 67.89 },
        { col1: "11-Apr-12", col2: 626.2, col3: 67.89 },
        { col1: "10-Apr-12", col2: 628.44, col3: 67.89 },
        { col1: "9-Apr-12", col2: 636.23, col3: 67.89 },
        { col1: "5-Apr-12", col2: 633.68, col3: 67.89 },
        { col1: "4-Apr-12", col2: 624.31, col3: 67.89 },
        { col1: "3-Apr-12", col2: 629.32, col3: 67.89 },
        { col1: "2-Apr-12", col2: 618.63, col3: 67.89 },  
        { col1: "30-Mar-12", col2: 599.55, col3: 67.89 },
        { col1: "29-Mar-12", col2: 609.86, col3: 67.89 },
        { col1: "28-Mar-12", col2: 617.62, col3: 67.89 },
        { col1: "27-Mar-12", col2: 614.48, col3: 67.89 },
        { col1: "26-Mar-12", col2: 606.98, col3: 67.89 },
      ];

      // set the dimensions and margins of the graph
      const margin = { top: 20, right: 20, bottom: 30, left: 50 };
      const width = 960 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      // parse the col1 / time
      const parseTime = d3.timeParse("%d-%b-%y");

      // set the ranges
      const x = d3.scaleTime().range([0, width]);
      const y = d3.scaleLinear().range([height, 0]);

      // define line

      // define the 1st line

      const valueline = d3
        .line()
        .x((d) => {
          return x(d.col1);
        })
        .y((d) => {
          return y(d.col2);
        });

      // define the 2nd line
      const valueline2 = d3
        .line()
        .x((d) => {
          return x(d.col1);
        })
        .y((d) => {
          return y(d.col3);
        });

      // append the svg obgect to the body of the page
      // appends a 'group' element to 'svg'
      // moves the 'group' element to the top left margin
      const svg = d3
        .select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      data.forEach((d) => {
        d.col1 = parseTime(d.col1);
        d.col2 = +d.col2;
        d.col3 = +d.col3;
      });

      // Scale the range of the data
      x.domain(
        d3.extent(data, function(d) {
          return d.col1;
        })
      );
      y.domain([
        0,
        d3.max(data, (d) => {
          return Math.max(d.col2, d.col3);
        }),
      ]);

      // Add the valueline path.
      svg
        .append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", valueline);

      // Add the valueline2 path.
      svg
        .append("path")
        .data([data])
        .attr("class", "line")
        .style("stroke", "red")
        .attr("d", valueline2);

      // Add the X Axis
      svg
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // Add the Y Axis
      svg.append("g").call(d3.axisLeft(y));
    },
  },
};
</script>

<style scoped>
.line {
  fill: none;
}
</style>
