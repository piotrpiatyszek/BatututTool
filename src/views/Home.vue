<template>
  <div class="home">
    <Split style="height: 100%;" direction="vertical">
      <SplitArea :size="25">
        <Split style="height: 100%;" direction="horizontal">
          <SplitArea :size="20">
            <PathsList @addLayer="addLayer" @deleteLayer="deleteLayer" @updateLayer="updateLayer" @actived="firstLayerId=$event"
            :paths="layers.filter(l => l.source === 'simplepaths')"></PathsList>
          </SplitArea>
          <SplitArea :size="80">
            <AudioPanel :layers="layers.filter(l => l.source === 'audiopaths')" :selection="lastSelect" @actived="firstLayerId=$event" @updateLayer="updateLayer"
            @deleteLayer="deleteLayer" @addLayer="addLayer"></AudioPanel>
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
          <PitchEnergyPlot :layer="layer" :yRange="yRange" :xRelRange="xRelRange" :holdXShift="holdXShift" :selection="lastSelect" @update="onRescale"
          @selection="onSelection" @updateLayer="updateLayer"></PitchEnergyPlot>
        </div>
        <div class="plotLayerContainer" v-for="layer in visibleLayers" :key="layer.layerId + 'energy'" style="z-index: 0">
          <EnergyPlot v-if="layer.energy && layer.energy.x && layer.plotEnergy" :xRelRange="xRelRange" :holdXShift="holdXShift" :layer="layer"></EnergyPlot>
        </div>
      </SplitArea>
    </Split>
  </div>
</template>

<script>
import PitchEnergyPlot from '@/components/PitchEnergyPlot.vue'
import EnergyPlot from '@/components/EnergyPlot.vue'
import AudioPanel from '@/components/AudioPanel.vue'
import PathsList from '@/components/PathsList.vue'

export default {
  name: 'home',
  components: {
    PitchEnergyPlot,
    EnergyPlot,
    AudioPanel,
    PathsList
  },
  watch: {
    firstLayerId (newValue) {
      this.layers.forEach((l, index) => {
        this.updateLayer(l.update({ isFirst: l.layerId === newValue }))
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
    onRescale: function (e, layer) {
      if (e.y) this.yRange = [e.y[0], e.y[1]]
      if (e.x) this.xRelRange = [e.x[0], e.x[1]]
      if (e.xShift) this.updateLayer(layer.update({ xShift: e.xShift }))
    },
    addLayer (layer) {
      if (!layer) throw new Error('[Home addLayer] empty layer argument')
      this.layers.push(layer)
    },
    deleteLayer (id) {
      this.layers = this.layers.filter(l => l.layerId !== id)
    },
    selectToPath () {
      if (!this.lastSelect || !this.lastSelect.pitchRanges) throw new Error('[Home selectToPath] Empty or invalid selection')
      var layer = this.layers.find(l => l.layerId === this.lastSelect.layerId)
      if (!layer) throw new Error('[Home selectToPath] Layer with id ' + this.lastSelect.layerId + ' does not exist')
      var xOffset = this.lastSelect.timeRange[0]
      var newLayer = layer.duplicate().sliceAndMerge(this.lastSelect.pitchRanges)
        .update({ name: layer.name + ' - Copy', source: 'simplepaths' }).moveX(-1 * xOffset)
      this.addLayer(newLayer)
    },
    updateLayer (layer) {
      var index = this.layers.findIndex(l => l.layerId === layer.layerId)
      if (index < 0) throw new Error('[Home updateLayer] Could not find layer with id: ' + layer.layerId)
      this.$set(this.layers, index, layer)
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
