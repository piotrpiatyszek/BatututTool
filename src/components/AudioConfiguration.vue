<template>
  <div class="audio-configuration">
    <div class="titlebar">
      <span>Audio Configuration</span>
      <div class="menubar">
        <button @click="$refs.fileinput.click()">📂</button>
        <input type="file" style="display: none" ref="fileinput" @change="loadFiles" multiple>
      </div>
    </div>
    <div class="configuration">
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioConfiguration',
  props: {
    configurations: Array,
    sourceConf: Object, // Own configuration of audio source
    sourceSharedConf: Number // Id of choosen shared conf, -1 if own conf is used
  },
  methods: {
    loadFiles (event) {
      // for (var file of event.target.files) {
      // TODO
      // }
    }
  }
}
</script>

<style>
.audio-configuration {
  width: 100%;
  height: 100%;
  position: relative;
  top: 0;
  left: 0;
}

.audio-configuration > .titlebar {
  background: #eee;
  border-bottom: 1px solid #bbb;
  height: 30px;
  position: relative;
}

.audio-configuration > .titlebar > span {
  color: #3f3f3f;
  line-height: 30px;
  margin-left: 5px;
  font-size: 17px;
}

.audio-configuration > .titlebar > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.audio-configuration > .titlebar > .menubar > button {
  height: 20px;
  margin: 5px 5px 0 0;
  background: white;
  border: 1px solid #bbb;
  line-height: 20px;
}

</style>
