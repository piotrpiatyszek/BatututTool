import Vue from 'vue'
import App from './App.vue'
import VueSplit from 'vue-split-panel'
import VueResource from 'vue-resource'

Vue.use(VueSplit)
Vue.use(VueResource)

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
