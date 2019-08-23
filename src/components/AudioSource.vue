<template>
  <div class="audiosource" v-bind:class="{active: isActive}" @click.self="$emit('actived')">
    <span class="sourcename" v-if="!nameEdit" @click="nameEdit=true">{{ visibleName }}</span>
    <input class="sourcename" type="text" :value="name" @keyup.enter="onNameEdited($event.target.value)" v-if="nameEdit">
    <div class="menubar">
      <button @click="$emit('play')">▶</button>
      <button @click="$emit('duplicate')">⎘</button>
      <button @click="$emit('download')">⇩</button>
      <button @click="$emit('delete')">❌</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioSource',
  props: {
    isActive: Boolean,
    name: String
  },
  computed: {
    visibleName () {
      return (this.name ? this.name : 'unnamed').slice(0, 20)
    }
  },
  data () {
    return {
      nameEdit: false
    }
  },
  methods: {
    onNameEdited (newName) {
      this.$emit('updateName', newName)
      this.nameEdit = false
    }
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
</style>
