<template>
  <div class="audio-panel">
    <Split style="height: 100%;" direction="horizontal">
      <SplitArea :size="25">
        <AudioSources :sources="audioSources" :activeSource="activeSourceId" :configurations="sharedConfigurations"
        :displaySliceButton="selection && selection.horizontalSelect && layers.findIndex(l => l.layerId === selection.layerId) >= 0"
        @delete="deleteSource" @actived="activeSourceId = $event ? $event : -1" @sliceAudio="sliceAudio"
        @addSource="addSource">
        </AudioSources>
      </SplitArea>
      <SplitArea :size="25">
        <ConfsList :configurations="sharedConfigurations" :activeSourceConf="(activeSource || {}).privateConf"
        :activeConf="activeConfId" :activeSourceName="(activeSource || {}).name" @actived="activeConfId = $event"
        @addConf="addConf" @delete="deleteConf" @update="updateConf">
        </ConfsList>
      </SplitArea>
      <SplitArea :size="25">
        <AudioConfiguration :conf="activeConf" :schema="confSchema" @update="updateConf">
        </AudioConfiguration>
      </SplitArea>
      <SplitArea :size="25">
        <AudioLayers :layers="activeAudioLayers" :displayExportButton="selection && selection.horizontalSelect && layers.findIndex(l => l.layerId === selection.layerId) >= 0" @exportToLayer="exportToLayer"
        @actived="$emit('actived', $event)" @updateLayer="$emit('updateLayer', $event)" @deleteLayer="deleteLayer($event)"></AudioLayers>
      </SplitArea>
    </Split>
  </div>
</template>

<script>
import AudioSources from '@/components/AudioSources.vue'
import AudioConfiguration from '@/components/AudioConfiguration.vue'
import ConfsList from '@/components/ConfsList.vue'
import AudioConfig from '@/lib/configuration.js'
import AudioLayers from '@/components/AudioLayers.vue'
import Layer from '@/lib/Layer.js'

export default {
  name: 'AudioPanel',
  props: {
    layers: Array,
    selection: Object
  },
  data () {
    return {
      activeSourceId: -1,
      audioSources: [],
      activeConfId: -1,
      sharedConfigurations: [],
      nextSourceId: 1,
      nextConfId: 1,
      confSchema: AudioConfig.getSchema()
    }
  },
  computed: {
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
  watch: {
    sharedConfigurations (newValue) {
      var ids = newValue.map(c => c.confId)
      this.audioSources.filter(s => s.sharedConf && !ids.includes(s.sharedConf.confId)).forEach(s => s.update({ sharedConf: undefined }))
    },
    layers (newValue, oldValue) {
      var layerIds = newValue.map(l => l.layerId)
      var oldLayerIds = oldValue.map(l => l.layerId)
      oldLayerIds.filter(layerId => !layerIds.includes(layerId)).forEach(this.deleteLayer)
    }
  },
  methods: {
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
          if (meta.layerId) this.$emit('deleteLayer', meta.layerId)
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
            self.$emit('addLayer', layer)
            return layer.layerId
          } else {
            self.$emit('updateLayer', layer)
            return layer.layerId
          }
        }
      })
    },
    deleteLayer (layerId) {
      this.audioSources.forEach(s => {
        if (s.layersMeta.findIndex(l => l.layerId === layerId) >= 0) s.update({ layersMeta: s.layersMeta.filter(l => l.layerId !== layerId) })
      })
      this.$emit('deleteLayer', layerId)
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
  },
  components: {
    AudioSources,
    AudioLayers,
    ConfsList,
    AudioConfiguration
  }
}
</script>

<style>
.audio-panel {
  width: 100%;
  height: 100%;
  position: relative;
  top: 0;
  left: 0;
}
</style>
