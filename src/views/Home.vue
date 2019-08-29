<template>
  <div class="home">
    <Split style="height: 100%;" direction="vertical">
      <SplitArea :size="25">
        <Split style="height: 100%;" direction="horizontal">
          <SplitArea :size="20">
            <PathsList @addLayer="addLayer('simplepaths', $event)" @deleteLayer="deleteLayer" @updateLayer="updateLayer" @actived="firstLayerId=$event"
            :paths="layers.filter(l => l.source === 'simplepaths')"></PathsList>
          </SplitArea>
          <SplitArea :size="80">
            <AudioPanel :layers="layers.filter(l => l.source === 'audiopaths')" :selection="lastSelect" @actived="firstLayerId=$event" @updateLayer="updateLayer"
            @deleteLayer="deleteLayer" @addLayer="addLayer('audiopaths', $event.layer, $event.callback)"></AudioPanel>
          </SplitArea>
        </Split>
      </SplitArea>
      <SplitArea :size="75" style="position: relative">
        <div class="layers-bar">
          <button v-for="layer in visibleLayers" :key="layer.layerId" v-bind:class="{active: layer.isFirst}"
          v-bind:style="{background: firstLayerId==layer.layerId ? layer.color : 'white', border: '3px solid ' + layer.color }" @click="firstLayerId=layer.layerId">{{ layer.layerId }}</button>
          <button v-bind:class="{active: holdXShift}" v-bind:style="{background: holdXShift ? 'grey':'white', border: '3px solid grey'}" @click="holdXShift=!holdXShift">🔒</button>
          <button v-bind:style="{border: '3px solid grey'}" @click="deleteLayer(firstLayerId)" v-if="firstLayer && firstLayer.deletable">❌</button>
          <button v-if="lastSelect" v-bind:style="{border: '3px solid grey'}" @click="selectToPath">Save to path</button>
        </div>
        <div class="plotLayerContainer" v-for="layer in visibleLayers" :key="layer.layerId" :style="{zIndex: layer.layerId==firstLayerId ? 1000:0}">
          <PitchEnergyPlot :trace="layer.trace" :isFirst="layer.isFirst" :layerId="layer.layerId" :color="layer.color" :yRange="yRange" :xRelRange="xRelRange"
          :holdXShift="holdXShift" :selection="lastSelect" :energy="layer.energy" :layerName="layer.name" @update="onRescale" @selection="onSelection"></PitchEnergyPlot>
        </div>
      </SplitArea>
    </Split>
  </div>
</template>

<script>
import PitchEnergyPlot from '@/components/PitchEnergyPlot.vue'
import AudioPanel from '@/components/AudioPanel.vue'
import PathsList from '@/components/PathsList.vue'

export default {
  name: 'home',
  components: {
    PitchEnergyPlot,
    AudioPanel,
    PathsList
  },
  watch: {
    firstLayerId (newValue) {
      this.layers.forEach((l, index) => {
        l.isFirst = l.layerId === newValue
        this.$set(this.layers, index, l)
      })
      this.lastSelect = null
    },
    layers (newValue) {
      var index = newValue.findIndex(l => l.layerId === this.firstLayerId && l.visible)
      if (index < 0) {
        var firstVisible = this.layers.find(l => l.visible)
        if (firstVisible) this.firstLayerId = firstVisible.layerId
      }
    }
  },
  computed: {
    visibleLayers () {
      return this.layers.filter(l => l.visible)
    },
    firstLayer () {
      return this.layers.find(l => l.layerId === this.firstLayerId)
    }
  },
  data: function () {
    return {
      layers: [],
      firstLayerId: -1,
      yRange: [0, 250],
      xRelRange: [0, 10],
      holdXShift: true,
      nextId: 1,
      lastSelect: null
    }
  },
  methods: {
    onSelection: function (e) {
      if (!e) return
      if (e.close && this.lastSelect && e.layerId === this.lastSelect.layerId) {
        this.lastSelect = null
      } else if (!e.close) this.lastSelect = e
    },
    onRescale: function (e) {
      if (e.y) this.yRange = [e.y[0], e.y[1]]
      if (e.x) this.xRelRange = [e.x[0], e.x[1]]
    },
    addLayer (sourceName, data, callback) {
      if (!data || !data.trace || !Array.isArray(data.trace.x) || !Array.isArray(data.trace.y) || data.trace.x.length !== data.trace.y.length) return
      data.name = data.name ? data.name + '' : 'unnamed'
      data.source = sourceName
      data.layerId = this.nextId
      data.visible = true
      data.color = 'black'
      data.isFirst = false
      if (data.deletable !== false) data.deletable = true
      this.nextId += 1
      this.layers.push(data)
      if (callback) callback(data.layerId)
    },
    deleteLayer (id) {
      this.layers = this.layers.filter(l => l.layerId !== id)
    },
    selectToPath () {
      if (!this.lastSelect || !this.lastSelect.pitchRanges) return
      var layer = this.layers.find(l => l.layerId === this.lastSelect.layerId)
      if (!layer) return
      var trace = { x: [], y: [] }
      for (var range of this.lastSelect.pitchRanges) {
        trace.x = trace.x.concat(layer.trace.x.slice(range[0], range[1] + 1))
        trace.y = trace.y.concat(layer.trace.y.slice(range[0], range[1] + 1))
        trace.x.push(layer.trace.x[range[1] + 1] + 0.000001)
        trace.y.push(null)
      }
      var xOffset = this.lastSelect.timeRange[0]
      trace.x.forEach((x, index) => {
        trace.x[index] = x - xOffset
      })
      var newLayer = { trace }
      if (layer.name) newLayer.name = layer.name + '-Copy'
      this.addLayer('simplepaths', newLayer)
    },
    updateLayer (layer) {
      var index = this.layers.findIndex(l => l.layerId === layer.layerId)
      if (index < 0) return
      var updated = Object.assign({}, this.layers[index], layer)
      this.$set(this.layers, index, updated)
    }
  }
}
</script>

<style>
.home {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  left: 0;
  top: 0;
  position: absolute;
}

.plotLayerContainer {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.layers-bar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10000;
}

.layers-bar > button {
  color: black;
  margin: 3px;
  text-decoration: none;
  background: #ffffff;
  padding: 5px;
  display: inline-block;
  transition: all 0.4s ease 0s;
}

.layers-bar > button.active {
  color: #ffffff;
  transition: all 0.4s ease 0s;
}
</style>
