<template>
  <div class="energyplot" v-resize:throttle.500="onResize">
    <div ref="plotcontainer"></div>
  </div>
</template>

<script>
import Plotly from 'plotly.js'
import resize from 'vue-resize-directive'

export default {
  name: 'EnergyPlot',
  props: {
    layer: Object,
    xRelRange: Array,
    holdXShift: Boolean
  },
  watch: {
    plotData: 'redraw',
    plotLayout (newValue) {
      if (this.$refs.plotcontainer) Plotly.relayout(this.$refs.plotcontainer, newValue)
    },
    layer (newValue) {
      if (newValue.energy !== this.energy) this.energy = newValue.energy
    }
  },
  data: function () {
    return {
      size: { width: 0, height: 0 },
      energy: this.layer.energy
    }
  },
  computed: {
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
          range: [this.layer.xShift + this.xRelRange[0], this.layer.xShift + this.xRelRange[1]]
        },
        yaxis: {
          range: [0, 1],
          autorange: false
        },
        shapes: [],
        showlegend: false,
        paper_bgcolor: 'rgba(255,255,255,0)',
        plot_bgcolor: 'rgba(255,255,255,0)',
        width: this.size.width,
        height: this.size.height
      }

      return layout
    },
    plotData () {
      var data = []
      if (!this.energy.x) return data
      data.push({
        x: this.energy.x,
        y: this.energy.values,
        mode: 'lines',
        name: this.layer.name,
        line: {
          width: 1,
          dash: 'dashdot',
          color: this.layer.color
        }
      })
      return data
    }
  },
  mounted: function () {
    this.redraw()
  },
  methods: {
    redraw: function () {
      var plotConfig = {
        staticPlot: true
      }
      Plotly.newPlot(this.$refs.plotcontainer, this.plotData, this.plotLayout, plotConfig)
      var cartesian = this.$refs.plotcontainer.getElementsByClassName('cartesianlayer')
      for (var c of cartesian) c.style.visibility = 'hidden'
    },
    onResize: function () {
      this.size = {
        width: this.$refs.plotcontainer.offsetWidth,
        height: this.$refs.plotcontainer.offsetHeight
      }
    }
  },
  directives: {
    resize
  }
}
</script>

<style lang="scss">
.energyplot, .energyplot > div {
  height: 100%;
  width: 100%;
}

.energyplot .cartesianlayer .plot {
  visibility: initial;
}
</style>
