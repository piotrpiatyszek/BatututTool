<template>
  <div class="audiosource" v-bind:class="{active: isActive}" @click.self="$emit('actived')">
    <span class="sourcename" v-if="!nameEdit" @click="nameEdit=true">{{ visibleName }}</span>
    <input class="sourcename" type="text" :value="source.name" @keyup.enter="onNameEdited($event.target.value)" v-if="nameEdit">
    <div class="menubar">
      <span v-if="source.request.waiting" style="color: red">⟳ </span>
      <span v-if="source.request.error" style="color: red">❌ </span>
      <button v-if="!source.isPlaying" @click="source.play()">▶</button>
      <button v-if="source.isPlaying" @click="source.stop()">■</button>
      <button @click="$emit('duplicate')">⎘</button>
      <button @click="confList=!confList" ref="conflistbutton">T</button>
      <button @click="source.download()">⇩</button>
      <button @click="$emit('delete')">❌</button>
    </div>
    <div class="conflist-container" v-if="confList" v-click-outside="hideConfList">
      <div v-for="c in mergedConfs" :key="c.confId" :class="{active: activeConf === c.confId}" class="conf"
      @click="source.update({ sharedConf: c.confId === -1 ? undefined : c })">{{ c.name }}</div>
    </div>
  </div>
</template>

<script>
import ClickOutside from 'vue-click-outside'

export default {
  name: 'AudioSource',
  props: {
    source: Object,
    isActive: Boolean,
    configurations: Array
  },
  computed: {
    visibleName () {
      return (this.source.name ? this.source.name : 'unnamed').slice(0, 20)
    },
    // Adds merge shared confs with fake own conf
    mergedConfs () {
      return [ ...this.configurations, { confId: -1, name: 'Own' } ]
    },
    activeConf () {
      return this.source.sharedConf ? this.source.sharedConf.confId : -1
    }
  },
  data () {
    return {
      nameEdit: false,
      confList: false
    }
  },
  methods: {
    onNameEdited (newName) {
      this.source.update({ name: newName })
      this.nameEdit = false
    },
    hideConfList () {
      this.confList = false
    }
  },
  mounted () {
    // Prevent closing picker after clicking to open it
    this.popupItem = this.$refs.conflistbutton
  },
  directives: {
    ClickOutside
  }
}
</script>

<style>

.audiosource {
  height: 40px;
  position: relative;
  border-bottom: 1px solid #bbb;
}

.audiosource.active {
  background: #effbff;
}

.audiosource span.sourcename {
  line-height: 40px;
  font-size: 20px;
  margin-left: 5px;
  color:  #3f3f3f;
}

.audiosource input.sourcename {
  height: 30px;
  margin: 4px 0 0 5px;
  border: 1px solid #bbb;
  padding: 0 4px;
}

.audiosource > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.audiosource > .menubar > button {
  height: 20px;
  margin: 10px 4px 0 0;
  background: white;
  border: 1px solid #bbb;
  padding: 0 4px;
  line-height: 20px;
  position: relative;
}

.audiosource > .conflist-container {
  position: absolute;
  right: 5px;
  background: white;
  /* Same as in color picker */
  box-shadow: 0 2px 10px rgba(0,0,0,.12), 0 2px 5px rgba(0,0,0,.16);
  border-radius: 2px;
  z-index: 100;
  width: 300px;
}

.audiosource > .conflist-container > .conf {
  font-size: 20px;
  color: #3f3f3f;
  width: calc(100% - 10px);
  padding: 5px;
  overflow-wrap: break-word;
}

.audiosource > .conflist-container > .conf.active {
  background: #effbff;
}
</style>
