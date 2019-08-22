<template>
  <div class="pitchplot" v-resize:throttle.500="onResize">
    <div ref="plotcontainer"></div>
  </div>
</template>

<script>
import Plotly from 'plotly.js'
import resize from 'vue-resize-directive'
import bs from 'binary-search'

export default {
  name: 'PitchPlot',
  props: {
    trace: Object,
    color: String,
    firstLayer: Boolean,
    yRange: Array,
    id: Number,
    xRelRange: Array,
    holdXShift: Boolean
  },
  watch: {
    trace: function (newValue) {
      this.redraw()
    },
    color: 'redraw',
    firstLayer: 'onChangeLayer',
    yRange: {
      handler: function (newValue, oldValue) {
        // console.log('#' + this.id + ' yRange watch')
        // console.log(oldValue, newValue)
        if (oldValue[0] === newValue[0] && oldValue[1] === newValue[1]) return
        // console.log('#' + this.id + ' updating range')
        this.plotlayout.yaxis.range = [newValue[0], newValue[1]]
        this.plotlayout.yaxis.autorange = false
        this.relayout()
      },
      deep: true
    },
    xRelRange: function (newValue, oldValue) {
      if (oldValue[0] === newValue[0] && oldValue[1] === newValue[1]) return
      this.plotlayout.xaxis.range = [this.xShift + newValue[0], this.xShift + newValue[1]]
      this.plotlayout.xaxis.autorange = false
      this.relayout()
    }
  },
  data: function () {
    return {
      plotdata: [],
      plotlayout: {},
      selected: null,
      xShift: 0
    }
  },
  mounted: function () {
    this.redraw()
  },
  methods: {
    redraw: function () {
      console.log('redraw ' + this.id)
      this.plotdata = []
      this.plotdata[0] = {
        x: this.trace.x,
        y: this.trace.y,
        mode: 'lines',
        line: {
          width: 2,
          color: this.color ? this.color : ''
        }
      }
      this.plotdata[1] = {
        x: [this.trace.x[0]],
        y: [this.trace.y[0]],
        type: 'scatter',
        mode: 'markers',
        marker: {
          opacity: 0
        }
      }
      this.plotlayout = {
        autosize: false,
        margin: {
          t: 0,
          r: 0,
          b: 50,
          l: 50
        },
        dragmode: 'pan',
        xaxis: {
          nticks: 50,
          range: [this.xShift + this.xRelRange[0], this.xShift + this.xRelRange[1]]
        },
        yaxis: {
          range: [this.yRange[0], this.yRange[1]]
        },
        shapes: [],
        showlegend: false,
        paper_bgcolor: 'rgba(255,255,255,0)',
        plot_bgcolor: 'rgba(255,255,255,0)'
      }
      this.plotlayout.width = this.$refs.plotcontainer.offsetWidth
      this.plotlayout.height = this.$refs.plotcontainer.offsetHeight
      var plotConfig = {
        modeBarButtonsToRemove: ['toggleSpikelines', 'lasso2d'],
        displayModeBar: true,
        displaylogo: false
      }
      Plotly.newPlot(this.$refs.plotcontainer, this.plotdata, this.plotlayout, plotConfig)
      this.$refs.plotcontainer.on('plotly_selected', (e) => { this.onSelect(e) })
      this.$refs.plotcontainer.on('plotly_relayout', (e) => { this.onRelayout(e) })
      this.onChangeLayer()
    },
    onResize: function () {
      this.plotlayout.width = this.$refs.plotcontainer.offsetWidth
      this.plotlayout.height = this.$refs.plotcontainer.offsetHeight
      this.relayout()
    },
    onRelayout: function (e) {
      var newRangeY = this.$refs.plotcontainer.layout.yaxis.range
      var newRangeX = this.$refs.plotcontainer.layout.xaxis.range
      // console.log('#' + this.id + ' onRelayout', e, newRange, this.yRange)
      if (newRangeY[0] !== this.yRange[0] || newRangeY[1] !== this.yRange[1]) this.$emit('update', { y: newRangeY })
      if (Math.abs(newRangeX[1] - newRangeX[0] - this.xRelRange[1] + this.xRelRange[0]) < 0.0001 && !this.holdXShift) {
        this.xShift = newRangeX[0] - this.xRelRange[0]
      } else {
        this.$emit('update', { x: [newRangeX[0] - this.xShift, newRangeX[1] - this.xShift] })
      }
    },
    relayout: function () {
      Plotly.relayout(this.$refs.plotcontainer, this.plotlayout)
    },
    closeSelect: function () {
      if (this.selected) {
        this.$emit('selected', null)
        this.selected = null
      }
      if (this.plotdata[2]) {
        this.plotdata.pop()
        Plotly.deleteTraces(this.$refs.plotcontainer, [2])
      }
      if (this.plotlayout.shapes.length > 0) {
        this.plotlayout.shapes = []
        Plotly.relayout(this.$refs.plotcontainer, this.plotlayout)
      }
    },
    onSelect: function (e) {
      this.closeSelect()
      if (!e || !e.range) return // Only box select

      var timeRange = e.range.x
      var valueRange = e.range.y

      var horizontalSelect = Math.abs(valueRange[0] - this.plotlayout.yaxis.range[0]) < 0.00001 && Math.abs(valueRange[1] - this.plotlayout.yaxis.range[1]) < 0.00001
      var verticalSelect = Math.abs(timeRange[0] - this.plotlayout.xaxis.range[0]) < 0.00001 && Math.abs(timeRange[1] - this.plotlayout.xaxis.range[1]) < 0.00001

      if (horizontalSelect) {
        this.plotlayout.shapes.push({
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: timeRange[0],
          y0: 0,
          x1: timeRange[1],
          y1: 1,
          fillcolor: '#d3d3d3',
          opacity: 0.2,
          line: {
            width: 2,
            dash: 'dot',
            fillcolor: '#d6d6d6'
          }
        })
      } else if (verticalSelect) {
        this.plotlayout.shapes.push({
          type: 'rect',
          yref: 'y',
          xref: 'paper',
          y0: valueRange[0],
          x0: 0,
          y1: valueRange[1],
          x1: 1,
          fillcolor: '#d3d3d3',
          opacity: 0.2,
          line: {
            width: 2,
            dash: 'dot',
            fillcolor: '#d6d6d6'
          }
        })
      } else {
        this.plotlayout.shapes.push({
          type: 'rect',
          yref: 'y',
          xref: 'x',
          y0: valueRange[0],
          x0: timeRange[0],
          y1: valueRange[1],
          x1: timeRange[1],
          fillcolor: '#d3d3d3',
          opacity: 0.2,
          line: {
            width: 2,
            dash: 'dot',
            fillcolor: '#d6d6d6'
          }
        })
      }
      Plotly.relayout(this.$refs.plotcontainer, this.plotlayout)

      var indexRange = [0, this.trace.x.length - 1]
      if (!verticalSelect) {
        indexRange[0] = bs(this.trace.x, timeRange[0], function (x, needle) { return x - needle })
        indexRange[1] = bs(this.trace.x, timeRange[1], function (x, needle) { return x - needle })
        if (indexRange[0] < 0) indexRange[0] = -1 * (indexRange[0] + 1)
        if (indexRange[1] < 0) indexRange[1] = -1 * (indexRange[1] + 2)
      }

      this.selected = { x: this.trace.x.slice(indexRange[0], indexRange[1] + 1), y: [], ranges: [] }
      var prevNA = true // true whan previous value was NA
      var newRangeStart = null
      for (var i = indexRange[0]; i <= indexRange[1]; i++) {
        if ((this.trace.y[i] <= valueRange[1] && this.trace.y[i] >= valueRange[0]) || horizontalSelect) {
          this.selected.y.push(this.trace.y[i])
          if (prevNA) {
            newRangeStart = i
          }
          prevNA = false
        } else {
          this.selected.y.push(null)
          if (!prevNA) {
            this.selected.ranges.push([ newRangeStart, i - 1 ])
          }
          prevNA = true
        }
      }
      if (!prevNA) {
        this.selected.ranges.push([ newRangeStart, indexRange[1] ])
      }

      // Add trace of selected values
      this.plotdata[2] = {
        x: this.selected.x,
        y: this.selected.y,
        mode: 'lines',
        line: {
          color: 'red',
          width: 3
        }
      }
      Plotly.addTraces(this.$refs.plotcontainer, this.plotdata[2])
      var event = {
        pitchRanges: this.selected.ranges,
        horizontalSelect,
        verticalSelect,
        timeRange,
        valueRange,
        layerId: this.id
      }
      this.$emit('selected', event)
    },
    onChangeLayer: function () {
      if (!this.firstLayer) this.closeSelect()
      var cartesian = this.$refs.plotcontainer.getElementsByClassName('cartesianlayer')
      for (var c of cartesian) c.style.visibility = this.firstLayer ? 'initial' : 'hidden'
    }
  },
  directives: {
    resize
  },
  beforeDestroy () {
    this.$emit('selected', null)
  }
}
</script>

<style lang="scss">
.pitchplot, .pitchplot > div {
  height: 100%;
  width: 100%;
}

.pitchplot .cartesianlayer .plot {
  visibility: initial;
}
</style>
