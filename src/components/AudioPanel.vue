<template>
  <div class="audio-panel">
    <Split style="height: 100%;" direction="horizontal">
      <SplitArea :size="25">
        <AudioSources :sources="audioSources" :activeSource="activeSourceId" @delete="deleteSource"
        @update="updateSource" @actived="activeSourceId = $event" @addSource="addSource"></AudioSources>
      </SplitArea>
      <SplitArea :size="50">
        <AudioConfiguration :configurations="sharedConfigurations" :sourceConf="(activeSource | {}).conf"
        :sourceSharedConf="activeSource  && activeSource.sharedConf >= 0 ? activeSource.sharedConf : -1 ">
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

export default {
  name: 'AudioPanel',
  data () {
    return {
      activeSourceId: -1,
      audioSources: [],
      sharedConfigurations: [],
      nextSourceId: 1
    }
  },
  computed: {
    activeSource () {
      return this.audioSources.find(s => s.sourceId === this.activeSourceId)
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
    }
  },
  components: {
    AudioSources,
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
