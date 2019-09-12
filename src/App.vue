<template>
  <div class="home" id="app">
    <Split style="height: 100%;" direction="vertical">
      <SplitArea :size="25">
        <Split style="height: 100%;" direction="horizontal">
          <SplitArea :size="20">
            <PathsList @addLayer="addLayer" @deleteLayer="deleteLayer" @updateLayer="updateLayer" @actived="firstLayerId=$event"
            :paths="layers.filter(l => l.source === 'simplepaths')"></PathsList>
          </SplitArea>
          <SplitArea :size="20">
            <AudioSources :sources="audioSources" :activeSource="activeSourceId" :configurations="sharedConfigurations"
            :displaySliceButton="lastSelect && lastSelect.horizontalSelect && layers.findIndex(l => l.layerId === lastSelect.layerId) >= 0"
            @delete="deleteSource" @actived="activeSourceId = $event ? $event : -1" @sliceAudio="sliceAudio"
            @addSource="addSource">
            </AudioSources>
          </SplitArea>
          <SplitArea :size="20">
            <ConfsList :configurations="sharedConfigurations" :activeSourceConf="(activeSource || {}).privateConf"
            :activeConf="activeConfId" :activeSourceName="(activeSource || {}).name" @actived="activeConfId = $event"
            @addConf="addConf" @delete="deleteConf" @update="updateConf">
            </ConfsList>
          </SplitArea>
          <SplitArea :size="20">
            <AudioConfiguration :conf="activeConf" :schema="confSchema" @update="updateConf">
            </AudioConfiguration>
          </SplitArea>
          <SplitArea :size="20">
            <AudioLayers :layers="activeAudioLayers" :displayExportButton="lastSelect && lastSelect.horizontalSelect && layers.findIndex(l => l.layerId === lastSelect.layerId) >= 0"
            @exportToLayer="exportToLayer" @actived="firstLayerId = $event" @updateLayer="updateLayer" @deleteLayer="deleteLayer"></AudioLayers>
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
import PathsList from '@/components/PathsList.vue'
import AudioSources from '@/components/AudioSources.vue'
import AudioConfiguration from '@/components/AudioConfiguration.vue'
import ConfsList from '@/components/ConfsList.vue'
import AudioConfig from '@/lib/configuration.js'
import AudioLayers from '@/components/AudioLayers.vue'
import Layer from '@/lib/Layer.js'

export default {
  name: 'home',
  components: {
    PitchEnergyPlot,
    EnergyPlot,
    PathsList,
    AudioSources,
    AudioLayers,
    ConfsList,
    AudioConfiguration
  },
  watch: {
    firstLayerId (newValue) {
      this.layers.forEach((l, index) => {
        this.updateLayer(l.update({ isFirst: l.layerId === newValue }))
      })
      this.lastSelect = null
    },
    layers (newValue, oldValue) {
      var index = newValue.findIndex(l => l.layerId === this.firstLayerId && l.visible)
      if (index < 0) {
        var firstVisible = this.layers.find(l => l.visible)
        if (firstVisible) this.firstLayerId = firstVisible.layerId
      }
      var layerIds = newValue.map(l => l.layerId)
      var oldLayerIds = oldValue.map(l => l.layerId)
      oldLayerIds.filter(layerId => !layerIds.includes(layerId)).forEach(this.deleteLayer)
    },
    sharedConfigurations (newValue) {
      var ids = newValue.map(c => c.confId)
      this.audioSources.filter(s => s.sharedConf && !ids.includes(s.sharedConf.confId)).forEach(s => s.update({ sharedConf: undefined }))
    }
  },
  computed: {
    visibleLayers () {
      return this.layers.filter(l => l.visible)
    },
    firstLayer () {
      return this.layers.find(l => l.layerId === this.firstLayerId)
    },
    activeSource () {
      return this.audioSources.find(s => s.sourceId === this.activeSourceId)
    },
    activeConf () {
      if (this.activeConfId === -1 && this.activeSource) return this.activeSource.privateConf
      return this.sharedConfigurations.find(c => c.confId === this.activeConfId)
    },
    activeAudioLayers () {
      var activeLayersIds = []
      if (this.activeSource) activeLayersIds = this.activeSource.layersMeta.filter(l => l.layerId).map(l => l.layerId)
      return this.layers.filter(l => activeLayersIds.includes(l.layerId))
    }
  },
  data: function () {
    return {
      layers: [],
      firstLayerId: -1,
      yRange: [0, 250],
      xRelRange: [0, 10],
      holdXShift: true,
      lastSelect: null,
      activeSourceId: -1,
      audioSources: [],
      activeConfId: -1,
      sharedConfigurations: [],
      nextConfId: 1,
      confSchema: AudioConfig.getSchema()
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
    },
    exportToLayer () {
      var firstLayer = this.layers.find(l => l.isFirst)
      if (!firstLayer) return
      this.audioSources.forEach(s => {
        var layer = s.layersMeta.find(l => l.layerId === firstLayer.layerId)
        if (!layer) return
        var offset = layer.range ? layer.range[0] : 0
        var newRange = [offset + this.selection.indexRange[0], offset + this.selection.indexRange[1]]
        s.update({ layersMeta: [...s.layersMeta, { range: newRange }] })
      })
    },
    sliceAudio () {
      var firstLayer = this.layers.find(l => l.isFirst)
      if (!firstLayer) throw new Error('[AudioPanel sliceAudio] Missing first layer')
      var source = this.audioSources.find(s => {
        return s.layersMeta.findIndex(l => l.layerId === firstLayer.layerId) >= 0
      })
      if (!source) throw new Error('[AudioPanel sliceAudio] Missing audio source for layerId')
      source.slice(this.selection.timeRange[0] * 1000, this.selection.timeRange[1] * 1000).then(resolve => {
        this.addSource(resolve)
      }, resolve => {
        throw new Error('[AudioPanel sliceaudio] Failed to slice audio: ', resolve)
      })
    },
    updateSource (newSource) {
      if (!newSource) throw new Error('[AudioPanel updateSource] Empty source')
      var index = this.audioSources.findIndex(s => s.sourceId === newSource.sourceId)
      if (index < 0) throw new Error('[AudioPanel updateSource] Could not find source')
      this.$set(this.audioSources, index, newSource.getProxy())
    },
    deleteSource (sourceId) {
      var source = this.audioSources.find(s => s.sourceId === sourceId)
      if (source) {
        source.layersMeta.forEach(meta => {
          if (meta.layerId) this.deleteLayer(meta.layerId)
        })
        source.stop()
      }
      this.audioSources = this.audioSources.filter(s => s.sourceId !== sourceId)
    },
    addSource (source) {
      if (!source) throw new Error('[AudioPanel addSource] Empty source')
      var self = this
      this.audioSources.push(source.getProxy())
      source.update({
        onerror (e, src) {
          self.deleteSource(src.sourceId)
          throw new Error('AudioSource error: ' + e)
        },
        onselfupdate () {
          self.updateSource(source)
        },
        onlayerupdate (update, layerId, range) {
          var layer = layerId ? self.layers.find(l => l.layerId === layerId) : null
          var isNewLayer = !layer
          if (isNewLayer) {
            layer = new Layer(Object.assign({}, update, { name: range === null ? 'Full' : '', deletable: range !== null, source: 'audiopaths' }))
          } else {
            layer = layer.update(update)
          }
          if (range) {
            layer = layer.slice(range)
          }
          if (isNewLayer) {
            self.addLayer(layer)
            return layer.layerId
          } else {
            self.updateLayer(layer)
            return layer.layerId
          }
        }
      })
    },
    deleteLayer (layerId) {
      this.audioSources.forEach(s => {
        if (s.layersMeta.findIndex(l => l.layerId === layerId) >= 0) s.update({ layersMeta: s.layersMeta.filter(l => l.layerId !== layerId) })
      })
      this.layers = this.layers.filter(l => l.layerId !== layerId)
    },
    addConf (conf) {
      if (!AudioConfig.validate(conf)) return
      conf.confId = this.nextConfId
      this.nextConfId += 1
      this.sharedConfigurations.push(conf)
    },
    updateConf (newConf) {
      if (!newConf) return
      if (newConf.confId) {
        var index = this.sharedConfigurations.findIndex(c => c.confId === newConf.confId)
        if (index < 0) return
        this.$set(this.sharedConfigurations, index, Object.assign({}, this.sharedConfigurations[index], newConf))
        this.audioSources.filter(s => s.sharedConf && s.sharedConf.confId === newConf.confId).forEach(s => s.update({ sharedConf: Object.assign({}, this.sharedConfigurations[index], newConf) }))
      } else {
        if (!this.activeSource) throw new Error('[AudioPanel updateConf] Cannot update privateConf, active source is missing')
        this.activeSource.update({ privateConf: Object.assign({}, this.sharedConfigurations[index], newConf) })
      }
    },
    deleteConf (confId) {
      this.sharedConfigurations = this.sharedConfigurations.filter(c => c.confId !== confId)
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
