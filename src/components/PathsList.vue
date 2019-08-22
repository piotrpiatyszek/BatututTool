<template>
  <div class="pathslist">
    <div class="titlebar">
      <span>Paths</span>
      <div class="menubar">
        <button @click="$refs.fileinput.click()">📂</button>
        <input type="file" style="display: none" ref="fileinput" @change="loadFiles" multiple>
      </div>
    </div>
    <div class="paths-container">
      <PathItem v-for="path in paths" :key="path.layerId" :layerId="path.layerId" :name="path.name" :visible="path.visible" :layerColor="path.color"
      v-on:update="updatePath" v-on:delete="deletePath" v-on:download="downloadPath" :isActive="path.isFirst">
      </PathItem>
    </div>
  </div>
</template>

<script>
import PathItem from '@/components/PathItem.vue'
import { saveAs } from 'file-saver'

export default {
  name: 'PathsList',
  props: {
    nextLayerId: Number,
    sourceName: String
  },
  data: function () {
    return {
      paths: []
    }
  },
  watch: {
    paths () {
      this.$emit('updateLayers', { source: this.sourceName, layers: this.paths.filter(p => p.visible) })
    }
  },
  mounted () {
    this.$emit('init', this)
  },
  methods: {
    updatePath (event) {
      var index = this.paths.findIndex(path => path.layerId === event.layerId)
      if (index < 0) return
      var updatedPath = Object.assign({}, this.paths[index], event)
      this.$set(this.paths, index, updatedPath)
    },
    deletePath (layerId) {
      this.paths = this.paths.filter(path => path.layerId !== layerId)
    },
    downloadPath (layerId) {
      var path = this.paths.find(path => path.layerId === layerId)
      if (!path) return
      var json = JSON.stringify({ x: path.trace.x, y: path.trace.y, name: path.name, color: path.color })
      saveAs(new Blob([json], { type: 'application/json', name: path.name + '.json' }), path.name + '.json')
    },
    loadFiles (event) {
      for (var file of event.target.files) {
        var reader = new FileReader()
        reader.onload = e => {
          try {
            this.loadPath(JSON.parse(e.target.result))
          } catch {}
        }
        reader.readAsText(file, 'UTF-8')
      }
    },
    loadPath (p) {
      if (p && Array.isArray(p.x) && Array.isArray(p.y) && p.x.length === p.y.length) {
        var path = {
          name: p.name ? p.name + '' : 'unnamed',
          trace: {
            x: p.x,
            y: p.y
          },
          visible: true,
          color: 'black',
          source: this.sourceName,
          layerId: this.nextLayerId
        }
        this.paths.push(path)
        this.$emit('genLayerId')
      }
    }
  },
  components: {
    PathItem
  }
}
</script>

<style>
.pathslist {
  width: 100%;
  height: 100%;
  position: relative;
  top: 0;
  left: 0;
}

.pathslist > .titlebar {
  background: #eee;
  border-bottom: 1px solid #bbb;
  height: 30px;
  position: relative;
}

.pathslist > .paths-container {
  height: calc(100% - 31px);
  overflow-y: scroll;
}

.pathslist > .titlebar > span {
  color: #3f3f3f;
  line-height: 30px;
  margin-left: 5px;
  font-size: 17px;
}

.pathslist > .titlebar > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.pathslist > .titlebar > .menubar > button {
  height: 20px;
  margin: 5px 5px 0 0;
  background: white;
  border: 1px solid #bbb;
  line-height: 20px;
}

</style>
