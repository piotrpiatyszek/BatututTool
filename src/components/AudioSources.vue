<template>
  <div class="audiosources">
    <div class="titlebar" @click.self="$emit('actived', null)">
      <span>Audio Sources</span>
      <div class="menubar">
        <button v-if="!recorder" @click="startRecording">•</button> <!-- TODO -->
        <button v-if="recorder" @click="stopRecording">STOP</button> <!-- TODO -->
        <button v-if="displaySliceButton" @click="$emit('sliceAudio')">Slice</button>
        <button @click="$refs.fileinput.click()">📂</button>
        <input type="file" style="display: none" ref="fileinput" @change="loadFiles" multiple>
      </div>
    </div>
    <div class="sources-container" @click.self="$emit('actived', null)">
      <AudioSource v-for="s in sources" :key="s.sourceId" :isActive="s.sourceId === activeSource" :configurations="configurations" :source="s"
      @delete="$emit('delete', s.sourceId)" @actived="$emit('actived', s.sourceId)" @duplicate="$emit('addSource', s.duplicate())">
      </AudioSource>
    </div>
  </div>
</template>

<script>
import AudioSource from '@/components/AudioSource.vue'
import Source from '@/lib/AudioSource.js'

export default {
  name: 'AudioSources',
  props: {
    sources: Array,
    displaySliceButton: Boolean,
    activeSource: Number,
    configurations: Array
  },
  methods: {
    startRecording () {
      var self = this
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        self.recorder = new MediaRecorder(stream, { mimeType: 'audio/ogg' })
        self.recorder.addEventListener('dataavailable', e => {
          self.audioChunks.push(e.data)
        })
        self.recorder.addEventListener('stop', () => {
          var blob = new Blob(self.audioChunks)
          var reader = new FileReader()
          var time = new Date().toString().replace(/.*(\d{2}):(\d{2}):(\d{2}).*/, '$1:$2:$3')
          reader.onload = e => {
            var base64Encoded = e.target.result.split(',')[1]
            Source.fromOgg(base64Encoded).then(response => {
              response.update({ name: time })
              this.$emit('addSource', response)
            }, response => {
              throw new Error('Failed to convert recording to wav: ', response)
            })
            self.audioChunks = []
          }
          reader.readAsDataURL(blob)
          stream.getTracks().forEach(track => track.stop())
        })
        self.audioChunks = []
        self.recorder.start()
      }).catch(e => {
        self.recorder = null
        self.audioChunks = []
        throw new Error('[AudioSources startRecording] Cannot start recording: ', e)
      })
    },
    stopRecording () {
      this.recorder.stop()
      this.recorder = null
    },
    loadFiles (event) {
      for (var file of event.target.files) this.loadFile(file)
    },
    loadFile (file) {
      var reader = new FileReader()
      reader.onload = e => {
        var audioSource = new Source({ dataURL: e.target.result, name: file.name })
        this.$emit('addSource', audioSource)
      }
      reader.readAsDataURL(file)
    }
  },
  components: {
    AudioSource
  },
  data () {
    return {
      recorder: null,
      audioChunks: []
    }
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
