<template>
  <div class="audiosource" v-bind:class="{active: isActive}">
    <span class="sourcename" v-if="!nameEdit" @click="nameEdit=true">{{ name }}</span>
    <input class="sourcename" type="text" v-model="name" @keyup.enter="nameEdit=false" v-if="nameEdit">
    <div class="menubar">
      <button>▶</button>
      <button @click="visible=!visible">👁<span class="cross" v-if="!visible">❌</span></button>
      <button>⎘</button>
      <button>⇩</button>
      <button>❌</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioSource',
  props: {
    isActive: Boolean
  },
  watch: {
    nameEdit (newValue) {
      if (!newValue && this.name.length === 0) this.name = 'unnamed'
    }
  },
  data: function () {
    return {
      name: 'testname',
      nameEdit: false,
      visible: true
    }
  },
  methods: {
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

button > span.cross {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0)
}
</style>
