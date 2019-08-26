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
      <!-- Layers list TODO -->
      </SplitArea>
    </Split>
  </div>
</template>

<script>
import AudioSources from '@/components/AudioSources.vue'
import AudioConfiguration from '@/components/AudioConfiguration.vue'
import ConfsList from '@/components/ConfsList.vue'
import AudioConfig from '@/lib/configuration.js'

export default {
  name: 'AudioPanel',
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
    }
  },
  methods: {
    updateSource (newSource) {
      if (!newSource || !newSource.sourceId) return
      var index = this.audioSources.findIndex(s => s.sourceId === newSource.sourceId)
      if (index < 0) return
      this.$set(this.audioSources, index, Object.assign({}, this.audioSources[index], newSource))
    },
    deleteSource (sourceId) {
      var source = this.audioSources.find(s => s.sourceId === sourceId)
      if (source && source.audio) source.audio.pause()
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
      if (source.audio.error) console.error('[' + source.name + '] ' + source.audio.error.message)
      else {
        this.audioSources.push(source)
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
        this.$set(this.sharedConfigurations, index, Object.assign({}, newConf))
      } else {
        this.updateSource({ sourceId: this.activeSourceId, conf: Object.assign({}, newConf) })
      }
    },
    deleteConf (confId) {
      this.sharedConfigurations = this.sharedConfigurations.filter(c => c.confId !== confId)
    }
  },
  components: {
    AudioSources,
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
