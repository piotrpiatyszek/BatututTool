<template>
  <div class="audiosource" v-bind:class="{active: isActive}" @click.self="$emit('actived')">
    <span class="sourcename" v-if="!nameEdit" @click="nameEdit=true">{{ visibleName }}</span>
    <input class="sourcename" type="text" :value="name" @keyup.enter="onNameEdited($event.target.value)" v-if="nameEdit">
    <div class="menubar">
      <span v-if="isWaiting" style="color: red">⟳ </span>
      <span v-if="isError" style="color: red">❌ </span>
      <button v-if="!isPlaying" @click="$emit('play')">▶</button>
      <button v-if="isPlaying" @click="$emit('stop')">■</button>
      <button @click="$emit('duplicate')">⎘</button>
      <button @click="confList=!confList" ref="conflistbutton">T</button>
      <button @click="$emit('download')">⇩</button>
      <button @click="$emit('delete')">❌</button>
    </div>
    <div class="conflist-container" v-if="confList" v-click-outside="hideConfList">
      <div v-for="c in mergedConfs" :key="c.confId" :class="{active: choosenConf === c.confId}" class="conf"
      @click="$emit('update', { sharedConf: c.confId })">{{ c.name }}</div>
    </div>
  </div>
</template>

<script>
import ClickOutside from 'vue-click-outside'

export default {
  name: 'AudioSource',
  props: {
    isActive: Boolean,
    isWaiting: Boolean,
    isError: Boolean,
    isPlaying: Boolean,
    configurations: Array,
    choosenConf: Number,
    name: String
  },
  computed: {
    visibleName () {
      return (this.name ? this.name : 'unnamed').slice(0, 20)
    },
    // Adds merge shared confs with fake own conf
    mergedConfs () {
      return [ ...this.configurations, { confId: -1, name: 'Own' } ]
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
      this.$emit('update', { name: newName })
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
