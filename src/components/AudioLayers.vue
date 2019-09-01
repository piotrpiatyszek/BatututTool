<template>
  <div class="audiolayers">
    <div class="titlebar">
      <span>Audio Layers</span>
      <div class="menubar">
        <button v-if="displayExportButton" @click="$emit('exportToLayer')">Export To Layer</button>
      </div>
    </div>
    <div class="audiolayers-container">
      <PathItem v-for="l in layers" :key="l.layerId" :path="l" @update="$emit('updateLayer', $event)" @delete="$emit('deleteLayer', $event)"
      @actived="$emit('actived', l.layerId)">
      </PathItem>
    </div>
  </div>
</template>

<script>
import PathItem from '@/components/PathItem.vue'

export default {
  name: 'AudioLayers',
  props: {
    layers: Array,
    displayExportButton: Boolean
  },
  components: {
    PathItem
  }
}
</script>

<style>
.audiolayers {
  width: 100%;
  height: 100%;
  position: relative;
  top: 0;
  left: 0;
}

.audiolayers > .titlebar {
  background: #eee;
  border-bottom: 1px solid #bbb;
  height: 30px;
  position: relative;
}

.audiolayers > .audiolayers-container {
  height: calc(100% - 31px);
  overflow-y: scroll;
}

.audiolayers > .titlebar > span {
  color: #3f3f3f;
  line-height: 30px;
  margin-left: 5px;
  font-size: 17px;
}

.audiolayers > .titlebar > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.audiolayers > .titlebar > .menubar > button {
  height: 20px;
  margin: 5px 5px 0 0;
  background: white;
  border: 1px solid #bbb;
  line-height: 20px;
}

</style>
