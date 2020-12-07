<template>
  <div class="visual-bar-chart">
    <v-row>
      <v-col cols="11" id="line-svg">
        <svg
          :id="barID"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          preserveAspectRatio="xMidYMid meet"
          ref="chartBarContainer"
          font-size="12"
        ></svg>
      </v-col>
      <!-- Render Chart Legend -->
      <v-col cols="1" class="pt-0 pb-0 pl-0 pr-0">
        <LegendVisualChart
          :listItem="keyColor"
          :color="color"
        ></LegendVisualChart>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import * as d3 from 'd3';
import LegendVisualChart from './LegendVisualChart.vue';
import {
  LINE_CHART_SIZE,
  CHART_TYPE,
  TIME_FORMAT
} from '@/constants/chart/visual-chart-setting.js';

export default {
  name: 'VisualBarChart',
  props: {
    data: Array,
    chartID: String,
    startTime: String,
    endTime: String,
    isAddChart: Boolean,
    chartType: Number
  },

  components: {
    LegendVisualChart
  },

  data() {
    return {
      barID: '',
      chartWidth: LINE_CHART_SIZE.WIDTH,
      chartHeight: LINE_CHART_SIZE.HEIGHT,
      isResize: false,
      legendID: '',
      keyColor: null,
      color: null,
      legendWidth: LINE_CHART_SIZE.WIDTH / 11,
      legendHeight: LINE_CHART_SIZE.HEIGHT
    };
  },
  mounted() {
    this.drawChart();
  },

  created() {
    this.barID = CHART_TYPE.BAR + '-' + this.chartID;
    this.legendID = 'legend' + '-' + this.chartID;
    window.addEventListener('resize', this.handleResizeScreen);
  },

  destroyed() {
    window.removeEventListener('resize', this.handleResizeScreen);
  },
  methods: {
    handleResizeScreen() {
      if (this.chartType == 1) {
        this.isResize = true;
      }
      this.drawChart();
    },
    drawChart() {
      if (
        this.isAddChart === true ||
        this.chartType == 1 ||
        this.isResize == true
      ) {
        this.chartWidth = this.$refs.chartBarContainer.getClientRects()[0].width;
        this.chartHeight = this.$refs.chartBarContainer.getClientRects()[0].height;
        this.legendWidth = this.chartWidth / 11;
        this.legendHeight = this.chartHeight;
      }
      this.renderChart();
    },
    renderChart() {
      const data = this.data;
      const margin = LINE_CHART_SIZE.MARGIN;
      const width = this.chartWidth - margin.right;
      const height = this.chartHeight - margin.bottom;

      const timeDataDisplay = this.collectTime(data);
      const timeFormat = d3.timeFormat(
        this.formatTimeXAxis(this.startTime, this.endTime)
      );
      const formatFullTime = d3.timeFormat(TIME_FORMAT.MILLISECONDS);

      // set the ranges
      const x0 = d3
        .scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.01);
      const x1 = d3.scaleBand().padding(0.05);
      const y = d3.scaleLinear().rangeRound([height, 0]);
      const color = d3.scaleOrdinal(d3.schemeCategory10);
      // Columns Information
      const sizeElement = Object.assign({}, ...data);
      color.domain(
        d3.keys(sizeElement).filter(key => {
          return key !== 'time';
        })
      );

      this.color = color;

      const timeseries = color.domain().map(name => {
        return {
          name: name,
          values: data.map(d => {
            return {time: d.time, values: +d[name]};
          })
        };
      });

      this.keyColor = timeseries.map(item => item.name);

      let svg = this.drawSVG(this.barID, margin);

      if (this.isResize == true || this.isAddChart === false) {
        svg = d3.select('#' + this.barID);
        svg.selectAll('*').remove();
        svg = this.drawSVG(this.barID, margin);
      }
      // load the data:
      const keys = [];
      let count = 0;
      data.forEach(d => {
        d.time = d.time;
        if (count < 1) count++;
        for (const prop in d) {
          if (d.hasOwnProperty(prop)) {
            if (prop != 'time' && keys.indexOf(prop) === -1) {
              if (count == 1) {
                keys.push(prop);
              }
              d[prop] = +d[prop];
            }
          }
        }
      });

      color.domain(
        d3.keys(data[0]).filter(key => {
          return key !== 'time';
        })
      );
      // scale the range of the data
      x0.domain(
        data.map(function(d) {
          if (timeFormat == '%Y-%m-%d %H:%M:%S.%L') {
            return formatFullTime(d.time);
          } else {
            return d.time;
          }
        })
      );
      x1.domain(keys).rangeRound([0, x0.bandwidth()]);
      let yMax = d3.max(data, function(d) {
        return d3.max(keys, function(key) {
          return d[key];
        });
      });
      let yMin = d3.min(data, function(d) {
        return d3.min(keys, function(key) {
          return d[key];
        });
      });

      if (yMin >= 0 && yMax < 1) {
        yMin = 0;
        yMax = 1;
      }

      if (yMin >= -1 && yMax <= 0) {
        yMin = -1;
        yMax = 0;
      }

      if (yMin == yMax) {
        yMin < 0 ? (yMax = 0) : (yMin = 0);
      }

      if (yMin > 0) yMin = 0;
      if (yMax < 0) yMax = 0;

      yMax = Math.ceil(yMax);
      yMin = Math.floor(yMin);

      y.domain([yMin, yMax]);

      // add axis
      svg
        .append('g')
        .attr('class', 'x axis')
        .attr('width', width)
        .attr('transform', 'translate(0, ' + height + ')')
        .call(
          d3
            .axisBottom(x0)
            .tickValues(timeDataDisplay)
            .tickFormat(timeFormat)
        )

        .selectAll('#' + this.barID + ' text')
        .style('text-anchor', 'begin')
        .attr('y', 20)
        .attr('dx', '-6em')
        .attr('dy', '-0.55em');

      d3.selectAll('#' + this.barID)
        .selectAll('.tick')
        .attr('transform', function(d, i) {
          return 'translate(' + ((height + 170) * i + 100) + ', 20)';
        });
      d3.selectAll('#' + this.barID + ' text').attr('y', 5);

      const yAxis = this.renderYAxis(y);

      svg
        .append('g')
        .attr('class', 'y axis')
        .attr('transform', `translate(20,0)`)
        .call(yAxis);

      // Calculate the width size between each group column of bar chart
      let barMarginLeft;
      let chartWidth;
      const numberOfColumns = Object.keys(sizeElement).length - 1;
      const groupChartWidth = this.calculateGroupChartSize(data) * 0.95;

      // Add bar chart
      svg
        .append('g')
        .attr('class', 'group-bar')
        .attr('transform', `translate(15,0)`)
        .selectAll('#' + this.barID + ' group-bar')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'bar')
        // Calculate margin left for bar chart
        .attr('transform', (d, index) => {
          chartWidth = Number((groupChartWidth / numberOfColumns).toFixed(2));
          if (index === 0) {
            barMarginLeft = 15;
          } else {
            barMarginLeft += groupChartWidth + groupChartWidth * 0.05;
          }
          return 'translate(' + barMarginLeft + ',0)';
        })
        .selectAll('#' + this.barID + ' rect')
        .data(d => {
          return keys.map(function(key) {
            return {key: key, value: d[key]};
          });
        })
        .enter()
        .append('rect')
        .attr('class', function(d) {
          return d.value < 0 ? 'negative' : 'positive';
        })
        .attr('x', function(d) {
          return x1(d.key);
        })
        .attr('width', chartWidth)
        .attr('y', function(d) {
          return y(Math.max(0, d.value));
        })
        .attr('height', function(d) {
          return Math.abs(y(d.value) - y(0));
        })
        .attr('fill', function(d) {
          return color(d.key);
        });

      const tooltip = svg
        .append('g')
        .attr('class', 'tooltip tooltip-component-bar');

      this.appendRectToTooltip(tooltip);

      const rows = d3
        .selectAll('#' + this.barID + ' .tooltip-component-bar')
        .data(data);

      const row = rows
        .append('g')
        .attr('class', 'tooltip-row')
        .attr('transform', 'translate(15,15)');
      rows.exit().remove();

      row
        .append('text')
        .attr('id', 'bar-tooltip-content')
        .attr('class', 'text-position');
      row.append('text').attr('class', 'space-position');
      row.append('text').attr('class', 'value-position');

      const groupColumn = svg.selectAll('#' + this.barID + ' .bar');

      groupColumn
        .on('mouseover', d => {
          const tooltipX = d3.mouse(svg.node())[0];
          d3.selectAll('#' + this.barID + ' .tooltip-component').style(
            'visibility',
            'visible'
          );

          d3.select('#' + this.barID).style('cursor', 'default');
          const keys = Object.keys(d).filter(key => key !== 'time');
          row
            .selectAll('#' + this.barID + ' .text-position')
            .style('fill', 'black')
            .attr('font-weight', 700)
            .attr('font-size', 12)
            .attr('transform', 'translate(0, -10)')
            .text(formatFullTime(d.time))
            .attr('dominant-baseline', 'hanging')
            .attr('text-rendering', 'optimizeLegibility')
            .attr('stroke', 'none');
          let position = 15;
          keys.forEach(key => {
            row
              .append('text')
              .attr('class', 'value-position')
              .attr('transform', 'translate(0,' + position + ')')
              .style('fill', color(key))
              .text(
                key.length > 10 ? key.substring(0, 10) + '...:' : key + ': '
              )
              .attr('font-size', 12)
              .append('tspan')
              .style('fill', 'black')
              .text(d[key]);
            position += 15;
          });
          const heightTooltip =
            document
              .getElementById(this.barID)
              .getElementById('bar-tooltip-content')
              .getBoundingClientRect().height *
            this.calculateHeightTooltipBarChart(keys.length);
          const arrayWidth = [];

          document
            .getElementById(this.barID)
            .getElementsByClassName('tooltip-row')
            .forEach(elementWidth => {
              arrayWidth.push(elementWidth.getBoundingClientRect().width);
            });

          const widthTooltip = Math.max(...arrayWidth) + 15;
          tooltip
            .select('#' + this.barID + ' .tooltip-component')
            .attr('width', widthTooltip + LINE_CHART_SIZE.SIZE_RIGHT)
            .attr('height', heightTooltip)
            .attr('fill', 'white')
            .attr('opacity', 0.7)
            .attr('stroke', '#c6c6c6')
            .attr('stroke-width', 0.5);
          if (tooltipX >= 500) {
            // Move the tooltip to the left of the cursor
            tooltip.attr('transform', `translate(${tooltipX - 180} , 0)`);
          } else {
            // Move the tooltip to the right of the cursor
            tooltip.attr('transform', `translate(${tooltipX} , 0)`);
          }
        })
        .on('mouseout', d => {
          d3.selectAll('#' + this.barID + ' .tooltip-component').style(
            'visibility',
            'hidden'
          );
          row.selectAll('#' + this.barID + ' .text-position').text('');
          row.selectAll('#' + this.barID + ' .value-position').text('');
        });

      this.$emit('click');
      this.isResize = false;
    },

    appendRectToTooltip(tooltip) {
      return tooltip
        .append('rect')
        .attr('class', 'tooltip-component')
        .attr('pointer-events', 'none')
        .attr('visibility', 'hidden');
    },

    drawSVG(barID, margin) {
      return d3
        .select('#' + barID)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    },
    renderYAxis(y) {
      return d3
        .axisLeft()
        .scale(y)
        .ticks(5)
        .tickFormat(d => this.displayTimeFormat(d));
    },

    displayTimeFormat(time) {
      const countLength = Math.round(Math.abs(time)).toString().length;
      if (time == 0) {
        return d3.format('d')(time);
      } else if (Math.abs(time) < 10) {
        return d3.format('.1f')(time);
      } else {
        return countLength < 7 ? d3.format('d')(time) : d3.format('.1n')(time);
      }
    },

    // Calculate the height of the tooltip for bar chart
    calculateHeightTooltipBarChart(numberOfColumns) {
      switch (numberOfColumns) {
        case 1:
          return numberOfColumns + 1.5;
        case 2:
          return numberOfColumns + 1.45;
        case 3:
          return numberOfColumns + 1.55;
        case 4:
          return numberOfColumns + 1.8;
        case 5:
          return numberOfColumns + 1.85;
        case 6:
          return numberOfColumns + 1.65;
        case 7:
          return numberOfColumns + 1.75;
        case 8:
          return numberOfColumns + 1.75;
        case 9:
          return numberOfColumns + 2.1;
        case 10:
          return numberOfColumns + 2;
        default:
          break;
      }
    },
    calculateGroupChartSize(chartData) {
      const totalPoint = chartData.length;
      return (this.chartWidth - 100) / totalPoint;
    }
  },
  watch: {
    data(val) {
      if (val) {
        this.isResize = false;
        this.drawChart();
      }
    }
  }
};
</script>

<style lang="scss">
.visual-bar-chart {
  // Style for line chart Bar management
  .axis path,
  .axis line {
    fill: none;
    stroke: grey;
    stroke-width: 0;
    shape-rendering: crispEdges;
  }

  .axis {
    font-size: 12px;
    color: black;
  }

  text.style-unit {
    stroke: grey;
  }

  g.x.axis {
    text-anchor: inherit !important;
  }

  .tooltip {
    color: rgb(37, 194, 37);
    font-family: Arial, Helvetica, sans-serif;
    background: black;
    padding: 10px;
    border: 3px solid white;
    box-shadow: 0 0px 10px black;
  }
}
</style>
