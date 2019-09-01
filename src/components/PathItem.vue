<template>
  <div class="pathitem" v-bind:class="{active: path.isFirst}" @click.self="actived">
    <span class="pathname" v-if="!nameEdit" @click="nameEdit=true">{{ visibleName }}</span>
    <input class="pathname" type="text" :value="path.name" @keyup.enter="onNameEdited($event.target.value)" v-if="nameEdit">
    <div class="menubar">
      <button v-if="path.plotEnergy !== undefined" @click="$emit('update', path.update({ plotEnergy: !path.plotEnergy}))">E<span class="cross" v-if="!path.plotEnergy">❌</span></button>
      <button v-if="path.plotEnergyWidthLine !== undefined" @click="$emit('update', path.update({ plotEnergyWidthLine: !path.plotEnergyWidthLine}))">
        EW<span class="cross" v-if="!path.plotEnergyWidthLine">❌</span>
      </button>
      <button @click="colorpicker=!colorpicker" v-bind:style="{background: color.hex, color: 'white'}" ref="colorbutton">{{ path.layerId }}</button>
      <button @click="$emit('update', path.update({ visible: !path.visible }))">👁<span class="cross" v-if="!path.visible">❌</span></button>
      <button @click="path.download()">⇩</button>
      <button v-if="path.deletable" @click="$emit('delete', path.layerId)">❌</button>
    </div>
    <div class="colorpicker-container" v-if="colorpicker" v-click-outside="hideColorPicker">
      <compact v-model="color"></compact>
    </div>
  </div>
</template>

<script>
import { Compact } from 'vue-color'
import ClickOutside from 'vue-click-outside'

export default {
  name: 'PathItem',
  props: {
    path: Object
  },
  watch: {
    'color': function () {
      // Updating only if color was changed by the color picker
      if (!this.colorpicker) return
      this.colorpicker = false
      this.$emit('update', this.path.update({ color: this.color.hex }))
    },
    'path.color' (newValue) {
      this.color = { hex: newValue }
    }
  },
  computed: {
    visibleName () {
      return (this.path.name ? this.path.name : 'unnamed').slice(0, 20)
    }
  },
  data: function () {
    return {
      nameEdit: false,
      colorpicker: false,
      color: { hex: this.path.color }
    }
  },
  methods: {
    actived () {
      if (this.path.visible) this.$emit('actived')
    },
    onNameEdited (newName) {
      this.$emit('update', this.path.update({ name: newName }))
      this.nameEdit = false
    },
    hideColorPicker () {
      this.colorpicker = false
    }
  },
  mounted () {
    // Prevent closing picker after clicking to open it
    this.popupItem = this.$refs.colorbutton
  },
  components: {
    Compact
  },
  directives: {
    ClickOutside
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
