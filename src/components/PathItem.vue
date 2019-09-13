<template>
  <div class="pathitem" v-bind:class="{active: path.isFirst}">
    <div class="base" @click.self="actived">
      <span class="pathname" v-if="!nameEdit" @click="nameEdit=true">{{ visibleName }}</span>
      <input class="pathname" type="text" :value="path.name" @keyup.enter="onNameEdited($event.target.value)" v-if="nameEdit">
      <div class="menubar">
        <button @click="open=!open">⚙<span class="cross" v-if="!open">❌</span></button>
        <button @click="colorpicker=!colorpicker" v-bind:style="{background: color.hex, color: 'white'}" ref="colorbutton">{{ path.layerId }}</button>
        <button @click="$emit('update', path.update({ visible: !path.visible }))">👁<span class="cross" v-if="!path.visible">❌</span></button>
        <button @click="path.download()">⇩</button>
        <button v-if="path.deletable" @click="$emit('delete', path.layerId)">❌</button>
      </div>
    </div>
    <div class="colorpicker-container" v-if="colorpicker" v-click-outside="hideColorPicker">
      <compact v-model="color"></compact>
    </div>
    <div class="options" v-if="open" @click.self="actived">
      <ul>
        <li v-for="o in options" :key="o.id">
          <button @click="o.action">👁<span class="cross" v-if="!o.value">❌</span></button>{{ o.name }}
        </li>
      </ul>
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
    },
    options () {
      var options = []
      var self = this
      if (this.path.plotEnergy !== undefined) {
        options.push({
          value: this.path.plotEnergy,
          action () {
            self.$emit('update', self.path.update({ plotEnergy: !self.path.plotEnergy }))
          },
          name: 'Energy plot',
          id: 0
        })
      }
      if (this.path.plotEnergyWidthLine !== undefined) {
        options.push({
          value: this.path.plotEnergyWidthLine,
          action () {
            self.$emit('update', self.path.update({ plotEnergyWidthLine: !self.path.plotEnergyWidthLine }))
          },
          name: 'Energy width-line plot',
          id: 1
        })
      }
      this.availableFeatures.forEach(f => {
        options.push({
          value: !!this.path.features[f.id],
          name: f.name,
          action () {
            if (self.path.features[f.id]) {
              self.$emit('update', self.path.removeFeature(f.id))
            } else {
              // eslint-disable-next-line
              self.path.getFeature(f.id).then(path => {
                self.$emit('update', path)
              }, e => {
                throw new Error('[PathItem options] Failed to load feature with id ' + f.id)
              })
            }
          },
          id: f.id + 2 // Id is used only for vue :key
        })
      })
      return options
    }
  },
  data: function () {
    return {
      nameEdit: false,
      colorpicker: false,
      open: false,
      color: { hex: this.path.color },
      availableFeatures: []
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
  created () {
    var self = this
    this.$http.get('http://localhost:8092/features').then(response => {
      if (!response.body || !response.body.features) throw new Error('[PathItem created] Failed to load features - invaid server response')
      self.availableFeatures = response.body.features
    }, response => {
      throw new Error('[PathItem created] Failed to load features - invalid server response')
    })
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
  position: relative;
  border-bottom: 1px solid #bbb;
}

.pathitem.active {
  background: #effbff;
}

.pathitem > .base {
  height: 40px;
  position: relative;
}

.pathitem > .base > span.pathname {
  line-height: 40px;
  font-size: 20px;
  margin-left: 5px;
  color:  #3f3f3f;
}

.pathitem > .base > input.pathname {
  height: 30px;
  border: 1px solid #bbb;
  padding: 0 4px;
  display: block;
  position: relative;
  top: 4px;
  left: 5px;
}

.pathitem > .base > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.pathitem > .base > .menubar > button {
  height: 20px;
  margin: 10px 4px 0 0;
  background: white;
  border: 1px solid #bbb;
  padding: 0 4px;
  line-height: 20px;
  position: relative;
}

.pathitem > .options > ul > li > button {
  height: 20px;
  background: white;
  border: 1px solid #bbb;
  margin: 0 3px 0 0;
  padding: 0 4px;
  line-height: 20px;
  position: relative;
}

.pathitem > .options > ul {
  list-style-type: none;
  display:inline-block;
  margin: 0;
  padding: 0 0 0 10px;
}

.pathitem > .options > ul > li {
  margin: 0 0 5px 0;
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
