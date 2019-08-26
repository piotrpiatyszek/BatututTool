<template>
  <div class="confitem" v-bind:class="{active: isActive}" @click.self="$emit('actived')">
    <span class="confname" v-if="!nameEdit" @click="nameEdit=editable">{{ visibleName }}</span>
    <input class="confname" type="text" :value="name" @keyup.enter="onNameEdited($event.target.value)" v-if="nameEdit && editable">
    <div class="menubar">
      <button @click="$emit('duplicate')">⎘</button>
      <button @click="$emit('download')">⇩</button>
      <button @click="$emit('delete')" v-if="editable">❌</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfItem',
  props: {
    isActive: Boolean,
    name: String,
    editable: Boolean
  },
  computed: {
    visibleName () {
      return (this.name ? this.name : 'unnamed').slice(0, 20)
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
    }
  }
}
</script>

<style>

.confitem {
  height: 40px;
  position: relative;
  border-bottom: 1px solid #bbb;
}

.confitem.active {
  background: #effbff;
}

.confitem span.confname {
  line-height: 40px;
  font-size: 20px;
  margin-left: 5px;
  color:  #3f3f3f;
}

.confitem input.confname {
  height: 30px;
  margin: 4px 0 0 5px;
  border: 1px solid #bbb;
  padding: 0 4px;
}

.confitem > .menubar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
}

.confitem > .menubar > button {
  height: 20px;
  margin: 10px 4px 0 0;
  background: white;
  border: 1px solid #bbb;
  padding: 0 4px;
  line-height: 20px;
  position: relative;
}
</style>
