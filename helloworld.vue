<template>
  <div>
    <div id="line-chart"></div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import {
  LINE_COLORS,
  LINE_CHART_SIZE
} from './visual-chart-setting.js';

export default {
  name: 'VisualLineChart',
  props: {
    data: Array
  },

  mounted() {
    this.renderChart();
  },
  data() {
    return {
      width: LINE_CHART_SIZE.WIDTH,
      height: LINE_CHART_SIZE.HEIGHT,
      valueLine: []
    };
  },
  methods: {
    renderChart() {
      // if (document.getElementsByTagName('svg')) {
      //   d3.selectAll('svg').remove();
      // }

      const data = this.data;

      const margin = LINE_CHART_SIZE.MARGIN;
      const width = this.width - margin.left - margin.right;
      const height = this.height - margin.top - margin.bottom;

      // parse the date / time
      // const parseDate = d3.timeParse(TIME_FORMAT.MILLISECONDS);

      // set the ranges
      const x = d3.scaleTime().range([0, width]);
      const y = d3.scaleLinear().range([height, 0]);

      const color = d3
        .scaleOrdinal()
        .domain(data)
        .range(LINE_COLORS);

      const xAxis = d3.axisBottom().scale(x);

      const yAxis = d3.axisLeft().scale(y);

      const line = d3
        .line()
        .x(function(d) {
          return x(d.time);
        })
        .y(function(d) {
          return y(d.values);
        });

      const svg = d3
        .select('#line-chart')
        .append('svg')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', `0 0 1366 220`)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      color.domain(
        d3.keys(data[0]).filter(key => {
          return key !== 'time';
        })
      );

      const timeseries = color.domain().map(name => {
        return {
          name: name,
          values: data.map(d => {
            return {time: d.time, values: +d[name]};
          })
        };
      });

      const keyColor = timeseries.map(item => item.name);

      x.domain(
        d3.extent(data, d => {
          return d.time;
        })
      );

      y.domain([
        d3.min(timeseries, c => {
          return d3.min(c.values, v => {
            return v.values;
          });
        }),
        d3.max(timeseries, c => {
          return d3.max(c.values, v => {
            return v.values;
          });
        })
      ]);

      svg
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

      svg
        .append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('class', 'style-unit')
        .attr('y', -40)
        .attr('x', -20)
        .attr('dy', '0')
        .style('text-anchor', 'middle')
        .text('values');

      const col = svg
        .selectAll('.col')
        .data(timeseries)
        .enter()
        .append('g')
        .attr('class', 'col')
        .attr('id', d => {
          return d.name.replace(' ', '');
        });

      col
        .append('path')
        .attr('class', 'line')
        .attr('d', d => {
          console.log(d.values);
          return line(d.values);
        })
        .style('stroke', d => {
          console.log(d.name);
          return color(d.name);
        });

      col
        .append('text')
        .datum(d => {
          return {name: d.name, value: d.values[d.values.length - 1]};
        })
        .attr('transform', d => {
          return 'translate(' + x(d.value.time) + ',' + y(d.value.values) + ')';
        })
        .attr('x', 3)
        .attr('dy', '.35em')
        .text(d => {
          return d.name;
        })
        .on('mouseenter', d => {
          svg
            .selectAll('#' + d.name.replace(' ', '') + ' path')
            .style('stroke', '#3e2723');
        })
        .on('mouseleave', d => {
          svg
            .selectAll('#' + d.name.replace(' ', '') + ' path')
            .style('stroke', color(d.name));
        });

      // add the Y gridlines
      svg
        .append('g')
        .attr('class', 'grid')
        .call(
          this.make_y_gridlines(y)
            .tickSize(-width)
            .tickFormat('')
        );

      const size = 10;
      svg
        .selectAll('mydots')
        .data(keyColor)
        .enter()
        .append('rect')
        .attr('class', 'position')
        .attr('x', width + LINE_CHART_SIZE.X_LEGEND)
        .attr('y', (d, i) => {
          return LINE_CHART_SIZE.Y_LEGEND + i * (size + 5);
        }) // 100 is where the first dot appears. 25 is the distance between dots
        .attr('width', size)
        .attr('height', size)
        .style('fill', d => {
          return color(d);
        });

      // Add the dots for the tooltip

      // Add one dot in the legend for each name.
      svg
        .selectAll('mylabels')
        .data(keyColor)
        .enter()
        .append('text')
        .attr('class', 'position')
        .attr('x', width + LINE_CHART_SIZE.X_LEGEND + size * 1.5)
        .attr('y', (d, i) => {
          return LINE_CHART_SIZE.Y_LEGEND + i * (size + 5) + size / 2;
        }) // 100 is where the first dot appears. 25 is the distance between dots
        .style('fill', d => {
          return color(d);
        })
        .text(d => {
          return d;
        })
        .attr('text-anchor', 'left')
        .style('alignment-baseline', 'middle');
    },

    // gridlines in y axis function
    make_y_gridlines(y) {
      return d3.axisLeft(y).ticks(5);
    }
  },

  watch: {
    data(val) {
      if (val) {
        this.renderChart();
      }
    }
  }
};
</script>

<style scoped>
</style>
