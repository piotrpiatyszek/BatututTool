<template>
  <div class="pitchplot" v-resize:throttle.500="onResize">
    <div ref="plotcontainer"></div>
  </div>
</template>

<script>
import Plotly from 'plotly.js'
import resize from 'vue-resize-directive'
import bs from 'binary-search'
import tinycolor from 'tinycolor2'

export default {
  name: 'PitchEnergyPlot',
  props: {
    trace: Object,
    energy: Object,
    color: String,
    isFirst: Boolean,
    yRange: Array,
    layerId: Number,
    xRelRange: Array,
    holdXShift: Boolean,
    selection: Object
  },
  watch: {
    plotData: 'redraw',
    isFirst: 'onChangeIsFirst',
    plotLayout (newValue) {
      if (this.$refs.plotcontainer) Plotly.relayout(this.$refs.plotcontainer, newValue)
    }
  },
  data: function () {
    return {
      selected: null,
      size: { width: 0, height: 0 },
      xShift: 0
    }
  },
  computed: {
    energyTrace () {
      if (this.energy && this.energy.mid.length >= 2) {
        var data = []
        var mids = this.energy.mid
        var values = this.energy.value
        var maxEnergy = Math.max(...values)

        var getTrace = function (trace, start, stop, light) {
          if (start < 0) start = 0
          if (stop > trace.x.length) stop = trace.x.length
          return {
            x: trace.x.slice(start, stop + 1),
            y: trace.y.slice(start, stop + 1),
            mode: 'lines',
            line: {
              width: 2,
              light: light // For color calculation
            }
          }
        }

        for (var i = 1; i < this.energy.mid.length; i++) {
          var energy = Math.floor((((values[i] + values[i - 1]) / 2) / maxEnergy) * 60)
          data.push(getTrace(this.trace, mids[i - 1], mids[i], 60 - energy))
        }
        return data
      }
      return null
    },
    plotLayout () {
      var layout = {
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
          autorange: false,
          range: [this.xShift + this.xRelRange[0], this.xShift + this.xRelRange[1]]
        },
        yaxis: {
          range: [this.yRange[0], this.yRange[1]],
          autorange: false
        },
        shapes: [],
        showlegend: false,
        paper_bgcolor: 'rgba(255,255,255,0)',
        plot_bgcolor: 'rgba(255,255,255,0)',
        width: this.size.width,
        height: this.size.height
      }

      if (this.selection && this.selection.layerId === this.layerId) {
        var s = this.selection
        var shape = {
          type: 'rect',
          fillcolor: '#d3d3d3',
          opacity: 0.2,
          line: {
            width: 2,
            dash: 'dot',
            fillcolor: '#d6d6d6'
          }
        }
        if (s.horizontalSelect) {
          shape = Object.assign(shape, {
            xref: 'x',
            yref: 'paper',
            x0: s.timeRange[0],
            y0: 0,
            x1: s.timeRange[1],
            y1: 1
          })
        } else if (s.verticalSelect) {
          shape = Object.assign(shape, {
            xref: 'paper',
            yref: 'y',
            x0: 0,
            y0: s.valueRange[0],
            x1: 1,
            y1: s.valueRange[1]
          })
        } else {
          shape = Object.assign(shape, {
            xref: 'x',
            yref: 'y',
            x0: s.timeRange[0],
            y0: s.valueRange[0],
            x1: s.timeRange[1],
            y1: s.valueRange[1]
          })
        }
        layout.shapes.push(shape)
      }
      return layout
    },
    plotData () {
      var data = []
      // Invisible marker just to enable selection
      data.push({
        x: [this.trace.x[0]],
        y: [this.trace.y[0]],
        type: 'scatter',
        mode: 'markers',
        marker: {
          opacity: 0
        }
      })

      if (this.energyTrace) {
        this.energyTrace.forEach(t => {
          t.line.color = tinycolor(this.color).lighten(t.line.light).toString()
        })
        data = data.concat(this.energyTrace)
      } else {
        data.push({
          x: this.trace.x,
          y: this.trace.y,
          mode: 'lines',
          line: {
            width: 2,
            color: this.color ? this.color : ''
          }
        })
      }

      if (this.selection && this.selection.layerId === this.layerId && this.selection.pitchRanges) {
        this.selection.pitchRanges.forEach(range => {
          var start = range[0] >= 0 ? range[0] : 0
          var stop = range[1] < this.trace.x.length ? range[1] : this.trace.x.length - 1
          data.push({
            x: this.trace.x.slice(start, stop + 1),
            y: this.trace.y.slice(start, stop + 1),
            mode: 'lines',
            line: {
              width: 3,
              color: 'red'
            }
          })
        })
      }
      return data
    }
  },
  mounted: function () {
    this.redraw()
  },
  methods: {
    redraw: function () {
      var plotConfig = {
        modeBarButtonsToRemove: ['toggleSpikelines', 'lasso2d'],
        displayModeBar: true,
        displaylogo: false
      }
      Plotly.newPlot(this.$refs.plotcontainer, this.plotData, this.plotLayout, plotConfig)
      this.$refs.plotcontainer.on('plotly_selected', (e) => { this.onSelect(e) })
      this.$refs.plotcontainer.on('plotly_relayout', (e) => { this.onRelayout(e) })
      this.onChangeIsFirst()
    },
    onResize: function () {
      this.size = {
        width: this.$refs.plotcontainer.offsetWidth,
        height: this.$refs.plotcontainer.offsetHeight
      }
    },
    onRelayout: function (e) {
      var newRangeY = this.$refs.plotcontainer.layout.yaxis.range
      var newRangeX = this.$refs.plotcontainer.layout.xaxis.range

      if (newRangeY[0] !== this.yRange[0] || newRangeY[1] !== this.yRange[1]) {
        this.$emit('update', { y: newRangeY })
      }
      if (Math.abs(newRangeX[1] - newRangeX[0] - this.xRelRange[1] + this.xRelRange[0]) < 0.0001 && !this.holdXShift) {
        this.xShift = newRangeX[0] - this.xRelRange[0]
      } else {
        var newXRelRange = [newRangeX[0] - this.xShift, newRangeX[1] - this.xShift]
        if (newXRelRange[0] !== this.xRelRange[0] || newXRelRange[1] !== this.xRelRange[1]) {
          this.$emit('update', { x: newXRelRange })
        }
      }
    },
    closeSelect: function () {
      this.$emit('selection', { layerId: this.layerId, close: true })
    },
    onSelect: function (e) {
      if (!e || !e.range) return this.closeSelect() // Only box select

      var timeRange = e.range.x
      var valueRange = e.range.y

      var horizontalSelect = Math.abs(valueRange[0] - this.plotLayout.yaxis.range[0]) < 0.00001 && Math.abs(valueRange[1] - this.plotLayout.yaxis.range[1]) < 0.00001
      var verticalSelect = Math.abs(timeRange[0] - this.plotLayout.xaxis.range[0]) < 0.00001 && Math.abs(timeRange[1] - this.plotLayout.xaxis.range[1]) < 0.00001

      var indexRange = [0, this.trace.x.length - 1]
      if (!verticalSelect) {
        indexRange[0] = bs(this.trace.x, timeRange[0], function (x, needle) { return x - needle })
        indexRange[1] = bs(this.trace.x, timeRange[1], function (x, needle) { return x - needle })
        if (indexRange[0] < 0) indexRange[0] = -1 * (indexRange[0] + 1)
        if (indexRange[1] < 0) indexRange[1] = -1 * (indexRange[1] + 2)
      }

      var ranges = []
      var prevNA = true // true whan previous value was NA
      var newRangeStart = null
      for (var i = indexRange[0]; i <= indexRange[1]; i++) {
        var isInside = (this.trace.y[i] <= valueRange[1] && this.trace.y[i] >= valueRange[0]) || horizontalSelect
        if (prevNA && isInside) {
          newRangeStart = i
          prevNA = false
        } else if (!prevNA && !isInside) {
          ranges.push([ newRangeStart, i - 1 ])
          prevNA = true
        }
      }
      if (!prevNA) {
        ranges.push([ newRangeStart, indexRange[1] ])
      }

      var event = {
        pitchRanges: ranges,
        horizontalSelect,
        verticalSelect,
        timeRange,
        valueRange,
        layerId: this.layerId
      }
      this.$emit('selection', event)
    },
    onChangeIsFirst: function () {
      if (!this.isFirst) this.closeSelect()
      var cartesian = this.$refs.plotcontainer.getElementsByClassName('cartesianlayer')
      for (var c of cartesian) c.style.visibility = this.isFirst ? 'initial' : 'hidden'
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
