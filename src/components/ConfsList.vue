<template>
  <div class="confslist">
    <div class="titlebar" @click.self="$emit('actived', null)">
      <span>Configurations</span>
      <div class="menubar">
        <button @click="$refs.fileinput.click()">📂</button>
        <input type="file" style="display: none" ref="fileinput" @change="loadFiles" multiple>
      </div>
    </div>
    <div class="confs-container" @click.self="$emit('actived', null)">
      <ConfItem :isActive="activeConf === -1" :name="'[' + activeSourceName + ']'" :editable="false"
      @actived="$emit('actived', -1)" v-if="activeSourceConf" @download='download(-1)'>
      </ConfItem>
      <ConfItem v-for="c in configurations" :key="c.confId" :isActive="c.confId === activeConf"
      :name="c.name" @delete="$emit('delete', c.confId)" @actived="$emit('actived', c.confId)"
      :editable="true" @download="download(c.confId)" @duplicate="duplicate(c.confId)"
      @update="$emit('update', Object.assign($event, { confId: c.confId }))">
      </ConfItem>
    </div>
  </div>
</template>

<script>
import ConfItem from '@/components/ConfItem.vue'
import { saveAs } from 'file-saver'

export default {
  name: 'ConfsList',
  props: {
    activeConf: Number,
    configurations: Array,
    activeSourceConf: Object,
    activeSourceName: String
  },
  methods: {
    loadFiles (event) {
      for (var file of event.target.files) this.loadFile(file)
    },
    loadFile (file) {
      var reader = new FileReader()
      reader.onload = e => {
        var conf
        try {
          conf = JSON.parse(e.target.result)
        } catch (e) {
          console.error(e)
        }
        if (conf) this.$emit('addConf', conf)
      }
      reader.readAsText(file, 'UTF-8')
    },
    download (confId) {
      var conf = this.configurations.find(c => c.confId === confId)
      if (confId === -1) conf = this.activeSourceConf
      if (!conf) return
      try {
        var copy = {}
        for (var name in conf) {
          if (name === 'confId') continue
          copy[name] = conf[name]
        }
        if (confId === -1) copy.name = this.activeSourceName
        var json = JSON.stringify(copy)
        var fileName = (confId === -1 ? this.activeSourceName : conf.name) + '.json'
        var blob = new Blob([json], { type: 'application/json', name: fileName })
        saveAs(blob, fileName)
      } catch {}
    },
    duplicate (confId) {
      var conf = this.configurations.find(c => c.confId === confId)
      if (confId === -1) conf = this.activeSourceConf
      if (!conf) return
      var copy = Object.assign({}, conf)
      copy.name = (copy.name || '') + ' - Copy'
      this.$emit('addConf', copy)
    }
  },
  components: {
    ConfItem
  }
}
</script>

<style>
.confslist {
  width: 100%;
  height: 100%;
  position: relative;
  top: 0;
  left: 0;
}

.confslist > .titlebar {
  background: #eee;
  border-bottom: 1px solid #bbb;
  height: 30px;
  position: relative;
}

.confslist > .confs-container {
  height: calc(100% - 31px);
  overflow-y: scroll;
}

.confslist > .titlebar > span {
  color: #3f3f3f;
  line-height: 30px;
  margin-left: 5px;
  font-size: 17px;
}

.confslist > .titlebar > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.confslist > .titlebar > .menubar > button {
  height: 20px;
  margin: 5px 5px 0 0;
  background: white;
  border: 1px solid #bbb;
  line-height: 20px;
}

</style>
