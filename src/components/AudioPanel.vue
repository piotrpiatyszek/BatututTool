<template>
  <div class="audio-panel">
    <Split style="height: 100%;" direction="horizontal">
      <SplitArea :size="25">
        <AudioSources :sources="audioSources" :activeSource="activeSourceId" :configurations="sharedConfigurations"
        @delete="deleteSource" @update="updateSource" @actived="activeSourceId = $event ? $event : -1"
        @addSource="addSource">
        </AudioSources>
      </SplitArea>
      <SplitArea :size="25">
        <ConfsList :configurations="sharedConfigurations" :activeSourceConf="(activeSource || {}).conf"
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
      if (this.activeConfId === -1 && this.activeSource) return this.activeSource.conf
      return this.sharedConfigurations.find(c => c.confId === this.activeConfId)
    },
    activeAudioLayers () {
      var activeLayersIds = {}
      if (this.activeSource) {
        this.activeSource.layers.forEach(l => {
          if (l.layerId) activeLayersIds[l.layerId] = true
        })
      }
      return this.layers.filter(l => activeLayersIds[l.layerId])
    }
  },
  methods: {
    exportToLayer () {
      var firstLayer = this.layers.find(l => l.isFirst)
      if (!firstLayer) return
      this.audioSources.forEach(s => {
        var layer = s.layers.find(l => l.layerId === firstLayer.layerId)
        if (!layer) return
        var offset = layer.range ? layer.range[0] : 0
        var newRange = [offset + this.selection.indexRange[0], offset + this.selection.indexRange[1]]
        s.layers.push({ range: newRange })
        this.refreshLayers(s.sourceId)
      })
    },
    updateSource (newSource) {
      if (!newSource || !newSource.sourceId) return
      var index = this.audioSources.findIndex(s => s.sourceId === newSource.sourceId)
      if (index < 0) return
      this.$set(this.audioSources, index, Object.assign({}, this.audioSources[index], newSource))
    },
    deleteSource (sourceId) {
      var source = this.audioSources.find(s => s.sourceId === sourceId)
      if (source && source.audio) source.audio.pause()
      if (source && source.layers) {
        source.layers.forEach(l => {
          if (l.layerId) this.$emit('deleteLayer', l.layerId)
        })
      }
      this.audioSources = this.audioSources.filter(s => s.sourceId !== sourceId)
    },
    addSource (source) {
      if (!source || !source.audio || !source.dataURL || !source.file) return
      source.sourceId = this.nextSourceId
      this.nextSourceId += 1
      source.name = source.name ? source.name + '' : 'unnamed'
      source.sharedConf = -1
      source.conf = AudioConfig.getDefaultConfig()
      source.playing = false
      source.layers = [ { range: null, layerId: null } ]
      source.request = { waiting: false }
      if (source.audio.error) console.error('[' + source.name + '] ' + source.audio.error.message)
      else {
        this.audioSources.push(source)
        this.refreshLayers(source.sourceId)
        source.audio.onerror = e => {
          console.error('[' + source.name + '] ' + e.target.error.message)
          this.deleteSource(source.sourceId)
        }
        source.audio.onplay = source.audio.onplaying = e => {
          this.updateSource({ sourceId: source.sourceId, playing: true })
        }
        source.audio.onpause = source.audio.onended = e => {
          this.updateSource({ sourceId: source.sourceId, playing: false })
        }
      }
    },
    deleteLayer (layerId) {
      this.audioSources.forEach(s => {
        if (s.layers) this.$set(s, 'layers', s.layers.filter(l => l.layerId !== layerId))
      })
      this.$emit('deleteLayer', layerId)
    },
    refreshLayers (sourceId) {
      var source = this.audioSources.find(s => s.sourceId === sourceId)
      if (!source) return
      // TODO backend
      source.request = { waiting: true, id: {} }
      var requestId = source.request.id
      setTimeout(() => {
        var source2 = this.audioSources.find(s => s.sourceId === sourceId)
        if (!source2) return
        if (requestId !== source2.request.id) return // Next request was sent
        this.$set(source2.request, 'waiting', false)
        var trace = { x: [...Array(50).keys()], y: [...Array(50).keys()] }
        trace.y.sort((e1, e2) => Math.random() - Math.random())
        source2.layers.forEach((l, index) => {
          var tracePart = {}
          if (l.range) {
            var start = l.range[0] >= 0 ? l.range[0] : 0
            var end = l.range[1] > start ? l.range[1] : start
            tracePart.x = trace.x.slice(start, end + 1)
            tracePart.y = trace.y.slice(start, end + 1)
          } else {
            tracePart = trace
          }

          if (l.layerId) {
            this.$emit('updateLayer', { layerId: l.layerId, trace: tracePart })
          } else {
            this.$emit('addLayer', {
              layer: {
                trace: tracePart,
                name: l.range ? '' : 'Full',
                deletable: !!l.range
              },
              callback: (layerId) => {
                if (!l || !source2) return
                l.layerId = layerId
                this.$set(source2.layers, index, l)
              }
            })
          }
        })
      }, 2000)
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
        this.audioSources.filter(s => s.sharedConf === newConf.confId).forEach(s => this.refreshLayers(s.sourceId))
      } else {
        this.updateSource({ sourceId: this.activeSourceId, conf: Object.assign({}, this.sharedConfigurations[index], newConf) })
        this.refreshLayers(this.activeSourceId)
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
