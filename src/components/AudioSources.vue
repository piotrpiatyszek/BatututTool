<template>
  <div class="audiosources">
    <div class="titlebar">
      <span>Audio Sources</span>
      <div class="menubar">
        <button>•</button>
        <button>📂</button>
      </div>
    </div>
    <div class="sources-container">
      <AudioSource></AudioSource>
      <AudioSource></AudioSource>
      <AudioSource :isActive="true"></AudioSource>
      <AudioSource></AudioSource>
    </div>
  </div>
</template>

<script>
import AudioSource from '@/components/AudioSource.vue'

export default {
  name: 'AudioSources',
  data: function () {
    return {
    }
  },
  methods: {
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
