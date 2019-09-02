<template>
  <div class="audio-configuration">
    <div class="titlebar">
      <span>Audio Configuration</span>
      <div class="menubar">
        <button @click="resetConfig">⟳</button>
      </div>
    </div>
    <div class="configuration" v-if="conf">
      <div v-for="s in schema" :key="s.name" class="input-box" :title="s.desc">
        {{ s.name }} <br>
        <input :value="config[s.name]" @change="onChange(s.name, $event.target.value)" :class="{ error: error[s.name], edited: edited[s.name] }" @keyup.enter="save">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioConfiguration',
  props: {
    conf: Object,
    schema: Object
  },
  watch: {
    conf: {
      handler () {
        this.config = Object.assign({}, this.conf)
        this.edited = {}
        this.error = {}
      },
      immediate: true
    }
  },
  data () {
    return {
      config: {},
      edited: {},
      error: {}
    }
  },
  methods: {
    onChange (name, value) {
      this.$set(this.edited, name, true)
      var parsed = value
      var error = false
      if (this.schema[name].type === 'Float') {
        error = !/^-?[0-9]+(e[0-9]+)?(\.[0-9]+)?$/.test(value)
        if (!error) parsed = Number.parseFloat(value)
      } else if (this.schema[name].type === 'Integer') {
        error = !/^-{0,1}\d+$/.test(value)
        if (!error) parsed = Number.parseInt(value)
      }
      this.$set(this.error, name, error)
      this.$set(this.config, name, parsed)
    },
    resetConfig () {
      Object.values(this.schema).forEach(s => this.onChange(s.name, s.value))
    },
    save () {
      for (var e in this.error) if (this.error[e]) return
      this.$emit('update', this.config)
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

.audio-configuration > .configuration > .input-box {
  display: inline-block;
  width: 140px;
  margin: 5px;
}

.audio-configuration > .configuration > .input-box > input {
  width: 100%;
  box-sizing: border-box;
}

.audio-configuration > .configuration > .input-box > input.error.edited {
  border-color: red;
}

.audio-configuration > .configuration > .input-box > input.edited {
  border-color: orange;
}
</style>
