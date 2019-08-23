<template>
  <div class="pathitem" v-bind:class="{active: isActive}" @click.self="actived">
    <span class="pathname" v-if="!nameEdit" @click="nameEdit=true">{{ visibleName }}</span>
    <input class="pathname" type="text" :value="name" @keyup.enter="onNameEdited($event.target.value)" v-if="nameEdit">
    <div class="menubar">
      <button @click="colorpicker=!colorpicker" v-bind:style="{background: color.hex, color: 'white'}">{{ layerId }}</button>
      <button @click="$emit('update', {layerId, visible: !visible})">👁<span class="cross" v-if="!visible">❌</span></button>
      <button @click="$emit('download', layerId)">⇩</button>
      <button @click="$emit('delete', layerId)">❌</button>
    </div>
    <div class="colorpicker-container" v-if="colorpicker">
      <compact v-model="color"></compact>
    </div>
  </div>
</template>

<script>
import { Compact } from 'vue-color'

export default {
  name: 'PathItem',
  props: {
    isActive: Boolean,
    layerId: Number,
    layerColor: String,
    visible: Boolean,
    name: String
  },
  watch: {
    'color': function () {
      this.colorpicker = false
      this.$emit('update', { layerId: this.layerId, color: this.color.hex })
    }
  },
  computed: {
    visibleName () {
      return (this.name ? this.name : 'unnamed').slice(0, 20)
    }
  },
  data: function () {
    return {
      nameEdit: false,
      colorpicker: false,
      color: { hex: this.layerColor }
    }
  },
  methods: {
    actived () {
      if (this.visible) this.$emit('actived')
    },
    onNameEdited (newName) {
      this.$emit('update', { layerId: this.layerId, name: newName })
      this.nameEdit = false
    }
  },
  components: {
    Compact
  }
}
</script>

<style>

.pathitem {
  height: 40px;
  position: relative;
  border-bottom: 1px solid #bbb;
}

.pathitem.active {
  background: #effbff;
}

.pathitem span.pathname {
  line-height: 40px;
  font-size: 20px;
  margin-left: 5px;
  color:  #3f3f3f;
}

.pathitem input.pathname {
  height: 30px;
  margin: 4px 0 0 5px;
  border: 1px solid #bbb;
  padding: 0 4px;
}

.pathitem > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.pathitem > .menubar > button {
  height: 20px;
  margin: 10px 4px 0 0;
  background: white;
  border: 1px solid #bbb;
  padding: 0 4px;
  line-height: 20px;
  position: relative;
}

button > span.cross {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0)
}

.pathitem > .colorpicker-container {
  position: absolute;
  right: 5px;
  z-index: 100;
}
</style>
