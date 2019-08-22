<template>
  <div class="home">
    <Split style="height: 100%;" direction="vertical">
      <SplitArea :size="25">
        <Split style="height: 100%;" direction="horizontal">
          <SplitArea :size="25">
            <PathsList sourceName="simplepaths" :nextLayerId="nextId" v-on:genLayerId="nextId += 1" v-on:updateLayers="updateLayers" v-on:init="pathsList=$event"></PathsList>
          </SplitArea>
          <SplitArea :size="25">
            <AudioSources></AudioSources>
          </SplitArea>
          <SplitArea :size="25">
          </SplitArea>
          <SplitArea :size="25">
          </SplitArea>
        </Split>
      </SplitArea>
      <SplitArea :size="75" style="position: relative">
        <div class="layers-bar">
          <button v-for="layer in layers" :key="layer.layerId" v-bind:class="{active: firstLayer==layer.layerId}"
          v-bind:style="{background: firstLayer==layer.layerId ? layer.color : 'white', border: '3px solid ' + layer.color }" @click="firstLayer=layer.layerId">{{ layer.layerId }}</button>
          <button v-bind:class="{active: holdXShift}" v-bind:style="{background: holdXShift ? 'grey':'white', border: '3px solid grey'}" @click="holdXShift=!holdXShift">🔒</button>
          <button v-bind:style="{border: '3px solid grey'}" @click="deleteLayer(firstLayer)">❌</button>
          <button v-if="!!lastSelect" v-bind:style="{border: '3px solid grey'}" @click="duplicateLayer()">⎘</button>
          <button v-if="lastSelect" v-bind:style="{border: '3px solid grey'}" @click="selectToPath">Save to path</button>
        </div>
        <div class="plotLayerContainer" v-for="layer in layers" :key="layer.layerId" v-bind:style="{zIndex: layer.layerId==firstLayer ? 1000:0}">
          <PitchPlot :trace="layer.trace" :firstLayer="layer.layerId == firstLayer" :id="layer.layerId" :color="layer.color" v-on:selected="onSelection" :yRange="yRange" v-on:update="onRescale" :xRelRange="xRelRange" :holdXShift="holdXShift"></PitchPlot>
        </div>
      </SplitArea>
    </Split>
  </div>
</template>

<script>
import PitchPlot from '@/components/PitchPlot.vue'
import AudioSources from '@/components/AudioSources.vue'
import PathsList from '@/components/PathsList.vue'
import * as testdata from '@/assets/testdata.json'

export default {
  name: 'home',
  components: {
    PitchPlot,
    AudioSources,
    PathsList
  },
  watch: {
    firstLayer (newValue) {
      this.layers.forEach((l, index) => {
        l.isFirst = l.layerId === newValue
        this.$set(this.layers, index, l)
      })
    }
  },
  data: function () {
    return {
      layers: [],

      firstLayer: 1,
      yRange: [0, 250],
      xRelRange: [0, 10],
      freeColors: ['#363732', '#7d80da', '#bdc696', '#9a879d', '#7a3b69', '#068d9d', '#a26769', '#47e5bc', '#ffcab1'],
      holdXShift: true,
      nextId: 1,
      pathsList: null,
      lastSelect: null
    }
  },
  methods: {
    onSelection: function (e) {
      this.lastSelect = e
    },
    onRescale: function (e) {
      if (e.y) this.yRange = [e.y[0], e.y[1]]
      if (e.x) this.xRelRange = [e.x[0], e.x[1]]
    },
    addLayer (data) {
      this.layers.push({
        layerId: this.nextId,
        trace: { x: data.x, y: data.y },
        color: this.freeColors.pop()
      })
      this.nextId += 1
    },
    deleteLayer (id) {
      this.layers = this.layers.filter(layer => {
        if (layer.layerId === id) this.freeColors.push(layer.color)
        return layer.layerId !== id
      })
      if (this.layers[0]) this.firstLayer = this.layers[0].layerId
    },
    duplicateLayer () {

    },
    selectToPath () {
      if (!this.lastSelect || !this.lastSelect.pitchRanges) return
      var layer = this.layers.find(l => l.layerId === this.lastSelect.layerId)
      if (!layer) return
      var newPath = { x: [], y: [] }
      for (var range of this.lastSelect.pitchRanges) {
        newPath.x = newPath.x.concat(layer.trace.x.slice(range[0], range[1] + 1))
        newPath.y = newPath.y.concat(layer.trace.y.slice(range[0], range[1] + 1))
        newPath.x.push(layer.trace.x[range[1] + 1] + 0.000001)
        newPath.y.push(null)
      }
      var xOffset = this.lastSelect.timeRange[0]
      newPath.x.forEach((x, index) => {
        newPath.x[index] = x - xOffset
      })
      if (layer.name) newPath.name = layer.name + '-Copy'
      this.pathsList.loadPath(newPath)
    },
    updateLayers (e) {
      this.layers = this.layers.filter(l => l.source !== e.source).concat(e.layers)
      // if (!this.lastSelect || this.layers.findIndex(l => l.layerId === this.lastSelect.layerId) < 0) this.lastSelect = null
      if (this.layers.findIndex(l => l.layerId === this.firstLayer) < 0 && this.layers.length > 0) this.firstLayer = this.layers[0].layerId
    }
  },
  mounted () {
    this.addLayer({ x: testdata.t.slice(0, 100000), y: testdata.f.slice(200000, 300000) })
    this.addLayer({ x: testdata.t.slice(0, 100000), y: testdata.f.slice(100000, 200000) })
    this.addLayer({ x: testdata.t.slice(0, 100000), y: testdata.f.slice(300000, 400000) })
    this.addLayer({ x: testdata.t.slice(0, 100000), y: testdata.f.slice(400000, 500000) })
    this.addLayer({ x: testdata.t.slice(0, 100000), y: testdata.f.slice(500000, 600000) })
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
