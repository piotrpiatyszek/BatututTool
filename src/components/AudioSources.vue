<template>
  <div class="audiosources">
    <div class="titlebar">
      <span>Audio Sources</span>
      <div class="menubar">
        <button v-if="false">•</button> <!-- TODO -->
        <button @click="$refs.fileinput.click()">📂</button>
        <input type="file" style="display: none" ref="fileinput" @change="loadFiles" multiple>
      </div>
    </div>
    <div class="sources-container">
      <AudioSource v-for="s in sources" :key="s.sourceId" :isActive="s.sourceId === activeSource" :name="s.name"
      :isPlaying="s.playing" @play="play(s.sourceId)" @delete="$emit('delete', s.sourceId)" @stop="stop(s.sourceId)"
      @actived="$emit('actived', s.sourceId)" @download="download(s.sourceId)" @duplicate="duplicate(s.sourceId)"
      @updateName="$emit('update', { sourceId: s.sourceId, name: $event })"></AudioSource>
    </div>
  </div>
</template>

<script>
import AudioSource from '@/components/AudioSource.vue'

export default {
  name: 'AudioSources',
  props: {
    sources: Array,
    activeSource: Number
  },
  methods: {
    loadFiles (event) {
      for (var file of event.target.files) this.loadFile(file)
    },
    loadFile (file) {
      var reader = new FileReader()
      reader.onload = e => {
        var audioSource
        try {
          var data = e.target.result
          var mime = data.split(',')[0]
          if (mime !== 'data:audio/x-wav;base64') {
            throw new Error('[' + file.name + '] Expected type data:audio/x-wav;base64 but got ' + mime)
          }
          var audio = new Audio(data)
          audioSource = {
            audio,
            name: file.name
          }
        } catch (e) {
          console.error(e)
        }
        if (audioSource) this.$emit('addSource', audioSource)
      }
      reader.readAsDataURL(file)
    },
    play (sourceId) {
      var source = this.sources.find(s => s.sourceId === sourceId)
      if (source) source.audio.play()
    },
    stop (sourceId) {
      var source = this.sources.find(s => s.sourceId === sourceId)
      if (source) {
        source.audio.pause()
        source.audio.currentTime = 0.0
      }
    },
    download (sourceId) {
      // TODO
    },
    duplicate (sourceId) {
      // TODO
    }
  },
  components: {
    AudioSource
  }
}
</script>

<style>
.audiosources {
  width: 100%;
  height: 100%;
  position: relative;
  top: 0;
  left: 0;
}

.audiosources > .titlebar {
  background: #eee;
  border-bottom: 1px solid #bbb;
  height: 30px;
  position: relative;
}

.audiosources > .sources-container {
  height: calc(100% - 31px);
  overflow-y: scroll;
}

.audiosources > .titlebar > span {
  color: #3f3f3f;
  line-height: 30px;
  margin-left: 5px;
  font-size: 17px;
}

.audiosources > .titlebar > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.audiosources > .titlebar > .menubar > button {
  height: 20px;
  margin: 5px 5px 0 0;
  background: white;
  border: 1px solid #bbb;
  line-height: 20px;
}

</style>
