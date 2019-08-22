import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueSplit from 'vue-split-panel'

Vue.use(VueSplit)
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
