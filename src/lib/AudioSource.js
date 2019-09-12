import { saveAs } from 'file-saver'
import AudioConfig from '@/lib/configuration.js'
import Vue from 'vue'

var validators = {
  dataURL (dataURL) {
    return dataURL && dataURL.split(',')[0] === 'data:audio/x-wav;base64'
  },
  audio (audio) {
    return !!audio
  },
  privateConf: AudioConfig.validate,
  sharedConf (sharedConf) {
    return !sharedConf || AudioConfig.validate(sharedConf)
  }
}

var nextId = 1000
var defaultProps = {
  get sourceId () {
    nextId += 1
    return nextId
  },
  name: '',
  privateConf: AudioConfig.getDefaultConfig(),
  isPlaying: false,
  layersMeta: [ { range: null, layerId: null } ],
  request: { waiting: false },
  dataURL: undefined,
  audio: undefined,
  onerror: undefined,
  onselfupdate: undefined,
  onlayerupdate: undefined,
  sharedConf: undefined
}

var requiredProps = ['dataURL']

class AudioSource {
  constructor (props, updateAllLayers = true) {
    var missingProps = requiredProps.filter(r => props[r] === undefined)
    if (missingProps.length > 0) throw new Error('[AudioSource constructor] Missing props: ' + missingProps)
    var invalidProps = Object.keys(props).map(k => validators[k]).filter(v => v).map(v => { return { name: v.name, value: v(props[v.name]) } })
      .filter(v => props[v.name] !== undefined && !v.value).map(v => v.name)
    if (invalidProps.length > 0) throw new Error('[AudioSource constructor] Invalid props: ' + invalidProps)

    Object.keys(defaultProps).forEach(p => {
      var defaultValue
      if (props[p] !== undefined) this[p] = props[p]
      else if ((defaultValue = defaultProps[p]) !== undefined) this[p] = defaultValue
    })

    if (!this.audio) {
      try {
        this.audio = new Audio(this.dataURL)
      } catch (e) {
        throw new Error('[AudioSource constructor] Cannot create audio object: ' + e)
      }
    }

    if (this.audio.error) {
      throw new Error('AudioSource constructor] Audio is broken')
    }

    this.audio.onerror = e => {
      if (this.onerror) this.onerror(e, this)
    }
    this.audio.onpause = this.audio.onended = e => {
      this.isPlaying = false
      if (this.onselfupdate) this.onselfupdate()
    }
    this.audio.onplay = this.audio.onplaying = e => {
      this.isPlaying = true
      if (this.onselfupdate) this.onselfupdate()
    }
    if (updateAllLayers) this.updateAllLayers()
  }
  update (props) {
    var invalidProps = Object.keys(props).map(k => validators[k]).filter(v => v).map(v => { return { name: v.name, value: v(props[v.name]) } })
      .filter(v => props[v.name] !== undefined && !v.value).map(v => v.name)
    if (invalidProps.length > 0) throw new Error('[AudioSource update] Invalid props: ' + invalidProps)
    Object.assign(this, props)
    if (props.hasOwnProperty('layersMeta') || props.hasOwnProperty('sharedConf') ||
      props.hasOwnProperty('privateConf')) this.updateAllLayers()
    if (this.onselfupdate) this.onselfupdate()
  }
  getConf () {
    return this.sharedConf || this.privateConf
  }
  updateAllLayers () {
    var requestId = {}
    this.update({ request: { waiting: true, id: requestId } })
    var self = this
    Vue.http.post('http://localhost:8092/pitch', {
      audio: this.dataURL.split(',')[1],
      configuration: this.getConf()
    }).then(response => {
      if (self.request.id !== requestId) return // Next request was sent
      self.update({ request: { waiting: false, error: false } })
      self.layersMeta.forEach((layerMeta, layerMetaIndex) => {
        if (self.onlayerupdate) {
          var layerId = self.onlayerupdate(response.body, layerMeta.layerId ? layerMeta.layerId : -1, layerMeta.range)
          if (layerId !== layerMeta.layerId) {
            var newLayersMeta = [...self.layersMeta]
            newLayersMeta[layerMetaIndex] = Object.assign({}, layerMeta, { layerId })
            self.update({ layersMeta: newLayersMeta })
          }
        }
      })
    }, response => {
      if (self.request.id !== requestId) return // Next request was sent
      self.update({ request: { waiting: false, error: true } })
    })
  }
  getProxy () {
    return new Proxy(this, {
      get (target, propKey) {
        var v = target[propKey]
        if (typeof v === 'function') return v.bind(target)
        else return v
      }
    })
  }
  duplicate () {
    return new AudioSource({ dataURL: this.dataURL, name: this.name + '-Copy' })
  }
  slice (start, end) {
    if (end > this.audio.duration * 1000) end = this.audio.duration * 1000
    if (start < 0) start = 0
    if (end <= start) throw new Error('[AudioSource slice] Invalid slice range')
    var self = this
    return new Promise((resolve, reject) => {
      Vue.http.post('http://localhost:8092/audioslice', {
        audio: self.dataURL.split(',')[1],
        range: [start, end]
      }).then(response => {
        if (!response.body || !response.body.audio) return reject(new Error('Invalid server response'))
        resolve(new AudioSource({
          name: self.name + '-Sliced',
          dataURL: 'data:audio/x-wav;base64,' + response.body.audio
        }))
      }, response => {
        reject(new Error('Invalid server response'))
      })
    })
  }
  async download () {
    var response = await fetch(this.dataURL)
    var blob = await response.blob()
    saveAs(blob, this.name + '.wav')
  }
  play () {
    this.audio.play()
  }
  stop (sourceId) {
    this.audio.pause()
    this.audio.currentTime = 0.0
  }
  static fromOgg (data) {
    return new Promise((resolve, reject) => {
      Vue.http.post('http://localhost:8092/audioconvert', {
        audio: data
      }).then(response => {
        if (!response.body || !response.body.audio) return reject(new Error('Invalid server response'))
        resolve(new AudioSource({
          dataURL: 'data:audio/x-wav;base64,' + response.body.audio
        }))
      }, response => {
        reject(new Error('Invalid server response'))
      })
    })
  }
}
export default AudioSource
