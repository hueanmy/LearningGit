<template>
  <div class="visual-line-chart">
    <v-row>
      <v-col cols="11" id="line-svg">
        <svg
          :id="svgID"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          preserveAspectRatio="xMidYMid meet"
          ref="chartLineContainer"
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
  name: 'VisualLineChart',

  components: {
    LegendVisualChart
    // ChartLegend
  },
  props: {
    data: Array,
    chartID: String,
    startTime: String,
    endTime: String,
    isAddChart: Boolean,
    width: String,
    chartType: Number
  },

  mounted() {
    if (this.data) {
      this.drawChart();
    }
  },
  data() {
    return {
      valueLine: [],
      svgID: '',
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
  created() {
    this.svgID = CHART_TYPE.LINE + '-' + this.chartID;
    this.legendID = 'legend' + '-' + this.chartID;
    window.addEventListener('resize', this.handleResizeScreen);
  },

  destroyed() {
    window.removeEventListener('resize', this.handleResizeScreen);
  },
  methods: {
    handleResizeScreen() {
      if (this.chartType == 0) {
        this.isResize = true;
      }
      this.drawChart();
    },

    drawChart() {
      if (
        this.isAddChart === true ||
        this.chartType == 0 ||
        this.isResize == true
      ) {
        this.chartWidth = this.$refs.chartLineContainer.getClientRects()[0].width;
        this.chartHeight = this.$refs.chartLineContainer.getClientRects()[0].height;
        this.legendWidth = this.chartWidth / 11;
        this.legendHeight = this.chartHeight;
      }

      this.renderChart();
    },

    renderChart() {
      const data = this.data;
      const margin = LINE_CHART_SIZE.MARGIN;

      let svg = this.drawSVG(this.svgID, margin);

      if (this.isResize == true || this.isAddChart === false) {
        svg = d3.select('#' + this.svgID);
        svg.selectAll('*').remove();
        svg = this.drawSVG(this.svgID, margin);
      }

      const timeDataDisplay = this.collectTime(data);
      const width = this.chartWidth - margin.right;
      const height = this.chartHeight - margin.bottom;

      // set the ranges
      const x = d3.scaleTime().range([0, width]);
      const y = d3.scaleLinear().range([height, 0]);

      const timeFormat = d3.timeFormat(
        this.formatTimeXAxis(this.startTime, this.endTime)
      );

      const formatFullTime = d3.timeFormat(TIME_FORMAT.MILLISECONDS);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

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
      this.listNodeItem = this.keyColor;

      const xAxis = this.renderXAxis(x, timeDataDisplay, timeFormat);
      const yAxis = this.renderYAxis(y);

      const line = d3
        .line()
        .defined(d => !isNaN(d.values))
        .x(d => {
          return x(d.time);
        })
        .y(d => {
          return y(d.values);
        });

      this.renderXDomain(x, data);

      let yMin = d3.min(timeseries, c => {
        return d3.min(c.values, v => {
          return v.values;
        });
      });

      let yMax = d3.max(timeseries, c => {
        return d3.max(c.values, v => {
          return v.values;
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

      // console.log(y.domain([yMin, yMax]));

      this.appendGXAxis(svg, xAxis, height, width);

      this.appendGYAxis(svg, yAxis);

      const col = svg
        .selectAll('#' + this.svgID + ' .col')
        .data(timeseries)
        .enter()
        .append('g')
        .attr('class', 'col')
        .attr('transform', `translate(17,0)`)
        .attr('id', d => {
          return d.name.replace(' ', '');
        });

      col
        .append('path')
        .attr('class', 'line')
        .attr('d', d => {
          return line(d.values);
        })
        .style('stroke', d => {
          return color(d.name);
        });

      // add the Y gridlines
      this.addYGridLine(svg, width, y);

      // Add Mouse Over
      const mouseG = this.addMoveOver(svg);

      // Add the black vertical line to follow mouse
      this.appendPathToMouseG(mouseG);

      const interpolateCursor = true;

      // append a rect to catch mouse movements on svg
      this.mouseMoveInRect(mouseG, svg, width, height, this.svgID);
      const updateTooltipContents = (tooltip, tooltipValues) => {
        if (!tooltipValues) return tooltip.attr('visibility', 'hidden');
        const rows = tooltip
          .selectAll('#' + this.svgID + ' .tooltip-row')
          .attr('id', 'rows-element')
          .data(tooltipValues, d => d.time + d.color + d.value + d.name);
        rows.exit().remove();

        const row = rows
          .enter()
          .append('g')
          .attr('class', 'tooltip-row')
          .attr('transform', (d, i) => {
            return `translate(5, ${i * 15 + 2})`;
          });
        rows.exit().remove();

        const colorSquareSize = LINE_CHART_SIZE.COLOR_SQUARE_SIZE;
        const textMargin = LINE_CHART_SIZE.TEXT_MARGIN;

        row
          .append('text')
          .attr('id', 'tooltip-content')
          .attr('class', 'position')
          .style('fill', d => {
            return d.color;
          })
          .attr('transform', `translate(${colorSquareSize + textMargin}, 10)`)
          .attr('fill', 'black')
          .text(d => {
            if (d.name != undefined) {
              return d.name.length > 10
                ? d.name.substring(0, 10) + '...' + ': '
                : d.name + ': ';
            }
          })
          .attr('font-size', 12)
          .append('tspan')
          .attr('fill', 'black')
          .attr('font-weight', d => {
            if (d.color == undefined) {
              return 700;
            }
          })
          .attr('font-size', 12)
          .text(d => d.value);

        const heightTooltip =
          document
            .getElementById(this.svgID)
            .getElementById('tooltip-content')
            .getBoundingClientRect().height *
          this.calculateHeightTooltipLineChart(rows._groups[0].length - 1);
        const arrayWidth = [];

        document
          .getElementById(this.svgID)
          .getElementsByClassName('tooltip-row')
          .forEach(elementWidth => {
            arrayWidth.push(elementWidth.getBoundingClientRect().width);
          });

        const widthTooltip = Math.max(...arrayWidth) + 15;

        tooltip
          .select('#' + this.svgID + ' .tooltip-component')
          .attr('width', widthTooltip + LINE_CHART_SIZE.SIZE_RIGHT)
          .attr('height', heightTooltip)
          .attr('fill', 'white')
          .attr('opacity', 0.7)
          .attr('stroke', '#c6c6c6')
          .attr('stroke-width', 0.5);

        const markers = mouseG
          .selectAll('#' + this.svgID + ' .cursor-data-marker')
          .data(tooltipValues, d => d);
        markers.exit().remove();
        markers
          .enter()
          .append('circle')
          .attr('transform', `translate(17,0)`)
          .attr('class', 'cursor-data-marker tooltip-component')
          .attr('pointer-events', 'all')
          .attr('r', 3)
          .attr('cx', d => {
            return x(d.time);
          })
          .attr('cy', d => {
            return y(d.value);
          })
          .attr('fill', d => {
            if (d.color === undefined) {
              d.color = 'rgba(192,192,192,0.0)';
            }
            return d.color;
          });
      };

      const plotArea = d3
        .select('#' + this.svgID + ' .mouse-over-effects')
        .style('cursor', 'default');

      // Create the tooltip
      const tooltip = this.createTooltip(svg);

      // Append rect to tooltip
      this.appendRectToTooltip(tooltip, height);

      const bs = d3.bisector(d => {
        return d.time;
      });
      const bisectDate = bs.left;
      mouseG.on('mousemove', () => {
        const x0 = x.invert(d3.mouse(svg.node())[0]);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        let d = undefined;
        let row = undefined;
        if (d1 != undefined && x0 - d0.time > d1.time - x0) {
          d = d1;
          row = data[i];
        } else {
          d = d0;
          row = data[i - 1];
        }
        let keys = [];
        Object.keys(row).forEach(prop => {
          keys.push(prop);
        });

        keys = keys.filter(x => x != 'time');
        let result = keys.map(k => {
          return {time: d.time, value: row[k], color: color(k), name: k};
        });

        result = _.orderBy(result, 'value', 'desc');

        const tempTime = result[0];

        result.unshift({
          time: tempTime.time,
          value: formatFullTime(tempTime.time)
        });
        const tooltipX = d3.mouse(svg.node())[0];
        if (!interpolateCursor) {
          tooltipX = x(d.time);
        }
        const verticalPositionPercent = 0.0;
        const tooltipY =
          plotArea.node().getBBox().height * verticalPositionPercent;
        if (tooltipX >= 500) {
          // Move the tooltip to the left of the cursor
          tooltip
            .attr('transform', `translate(${tooltipX - 180}, ${tooltipY})`)
            .call(updateTooltipContents, result);
        } else {
          // Move the tooltip to the right of the cursor
          tooltip
            .attr('transform', `translate(${tooltipX + 20}, ${tooltipY})`)
            .call(updateTooltipContents, result);
        }
      });
      this.$emit('click');
      this.isResize = false;
    },

    drawSVG(svgID, margin) {
      const svg = d3
        .select('#' + this.svgID)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      return svg;
    },

    createTooltip(svg) {
      return svg
        .append('g')
        .attr('class', 'tooltip tooltip-component')
        .attr('id', 'tooltip-id');
    },

    appendRectToTooltip(tooltip, heightTooltip, widthTooltip) {
      tooltip
        .append('rect')
        .attr('class', 'tooltip-component')
        .attr('transform', `translate(5,0)`)
        .attr('pointer-events', 'none')
        .attr('visibility', 'hidden')
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('max-height', heightTooltip)
        .attr('stroke-width', 1);
    },

    mouseMoveInRect(mouseG, svg, width, height, svgID) {
      return mouseG
        .append('svg:rect') // append a rect to catch mouse movements on svg
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', () => {
          // on mouse out hide line, circles and text
          d3.select('#' + svgID + ' .mouse-line').style('opacity', '0');
          d3.selectAll('#' + svgID + ' .mouse-per-line circle').style(
            'opacity',
            '0'
          );
          d3.selectAll('#' + svgID + ' .mouse-per-line text').style(
            'opacity',
            '0'
          );
          d3.selectAll('#' + svgID + ' .tooltip-component').style(
            'visibility',
            'hidden'
          );
        })
        .on('mouseleave', () => {
          d3.selectAll('#' + svgID + ' .mouse-per-line text').style(
            'opacity',
            '0'
          );
        })
        .on('mouseover', () => {
          // on mouse in show line, circles and text
          d3.select('#' + svgID + ' .mouse-line').style('opacity', '1');
          d3.selectAll('#' + svgID + ' .mouse-per-line circle').style(
            'opacity',
            '1'
          );
          d3.selectAll('#' + svgID + ' .mouse-per-line text').style(
            'opacity',
            '1'
          );
          d3.selectAll('#' + svgID + ' .tooltip-component').style(
            'visibility',
            'visible'
          );
        })
        .on('mousemove', () => {
          // mouse moving over canvas
          d3.select('#' + svgID + ' .mouse-line').attr('d', function() {
            const cursorX = d3.mouse(svg.node())[0];
            let d = 'M' + cursorX + ',' + height;
            d += ' ' + cursorX + ',' + 0;
            return d;
          });
        });
    },

    appendPathToMouseG(mouseG) {
      return mouseG
        .append('path') // this is the black vertical line to follow mouse
        .attr('class', 'mouse-line')
        .attr('transform', `translate(17,0)`)
        .style('stroke', 'rgb(199, 195, 195)')
        .style('stroke-width', '0.5px')
        .style('opacity', '0');
    },

    renderXAxis(x, timeDataDisplay, timeFormat) {
      return d3
        .axisBottom()
        .scale(x)
        .tickValues(timeDataDisplay)
        .tickFormat(timeFormat);
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

    renderXDomain(x, data) {
      x.domain(
        d3.extent(data, d => {
          return d.time;
        })
      );
    },
    addMoveOver(svg) {
      return svg
        .append('g')
        .attr('class', 'mouse-over-effects')
        .attr('transform', 'translate(0,0)');
    },

    appendGXAxis(svg, xAxis, height, width) {
      return svg
        .append('g')
        .attr('class', 'x axis')
        .attr('width', width)
        .attr('transform', 'translate(15,' + height + ')')
        .call(xAxis);
    },
    appendGYAxis(svg, yAxis) {
      return svg
        .append('g')
        .attr('class', 'y axis')
        .attr('transform', `translate(20, 0)`)
        .call(yAxis);
    },

    addYGridLine(svg, width, y) {
      svg
        .append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(17,0)`)
        .call(
          this.make_y_gridlines(y)
            .tickSize(-width)
            .tickFormat('')
        );
    },

    // gridlines in y axis function
    make_y_gridlines(y) {
      return d3.axisLeft(y).ticks(10);
    },

    // Calculate the height of the tooltip for line chart
    calculateHeightTooltipLineChart(numberOfColumns) {
      switch (numberOfColumns) {
        case 1:
          return numberOfColumns + 1.2;
        case 2:
          return numberOfColumns + 1.4;
        case 3:
          return numberOfColumns + 1.5;
        case 4:
          return numberOfColumns + 1.75;
        case 5:
          return numberOfColumns + 1.8;
        case 6:
          return numberOfColumns + 1.6;
        case 7:
          return numberOfColumns + 1.7;
        case 8:
          return numberOfColumns + 1.75;
        case 9:
          return numberOfColumns + 2;
        case 10:
          return numberOfColumns + 2;
        default:
          break;
      }
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
.visual-line-chart {
  .axis path,
  .axis line {
    fill: none;
    stroke: grey;
    stroke-width: 0;
    shape-rendering: crispEdges;
  }

  g.x.axis {
    text-anchor: inherit !important;
  }

  .line {
    fill: none;
    stroke: steelblue;
    stroke-width: 0.12rem;
    fill-opacity: 1;
  }

  .grid line {
    stroke: rgb(226, 224, 224);
    stroke-opacity: 0.5;
    shape-rendering: crispEdges;
  }

  .grid path {
    stroke-width: 0;
  }

  .axis {
    font-size: 12px;
    color: black;
  }

  text.style-unit {
    stroke: grey;
  }
}
</style>
