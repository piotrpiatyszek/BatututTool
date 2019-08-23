<template>
  <div class="audio-panel">
    <Split style="height: 100%;" direction="horizontal">
      <SplitArea :size="25">
        <AudioSources :sources="audioSources" :activeSource="activeSourceId" @delete="deleteSource"
        @update="updateSource" @actived="activeSourceId = $event"></AudioSources>
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
      sharedConfigurations: []
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
      this.audioSources = this.audioSources.filter(s => s.sourceId !== sourceId)
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
