import { saveAs } from 'file-saver'

var validators = {
  trace (trace) {
    return trace && Array.isArray(trace.x) && Array.isArray(trace.y) && trace.x.length === trace.y.length
  },
  energy (energy) {
    if (!energy || !Array.isArray(energy.values) || energy.values.length < 2) return false
    if (energy.mids && (!Array.isArray(energy.mids) || energy.mids.length !== energy.values.length)) return false
    if (energy.x && (!Array.isArray(energy.x) || energy.x.length !== energy.values.length)) return false
    if (!energy.x && !energy.mids) return false
    return true
  }
}

var nextId = 100
var defaultProps = {
  get layerId () {
    nextId += 1
    return nextId
  },
  name: '',
  visible: true,
  xShift: 0,
  color: 'black',
  isFirst: false,
  plotEnergy: undefined,
  plotEnergyWidthLine: undefined,
  deletable: true,
  source: '',
  trace: undefined,
  energy: undefined
}

class Layer {
  constructor (props) {
    if (!props.trace) throw new Error('[Layer constructor] Empty trace prop')
    var invalidProps = Object.keys(props).map(k => validators[k]).filter(v => v).map(v => { return { name: v.name, value: v(props[v.name]) } })
      .filter(v => props[v.name] !== undefined && !v.value).map(v => v.name)
    if (invalidProps.length > 0) throw new Error('[Layer constructor] Invalid props: ' + invalidProps)

    Object.keys(defaultProps).forEach(p => {
      var defaultValue
      if (props[p] !== undefined) this[p] = props[p]
      else if ((defaultValue = defaultProps[p]) !== undefined) this[p] = defaultValue
    })

    if (this.energy && this.energy.mids && this.plotEnergyWidthLine === undefined) this.plotEnergyWidthLine = false
    if (this.energy && this.energy.x && this.plotEnergy === undefined) this.plotEnergy = false
  }
  update (props) {
    return new Layer(Object.assign({}, this, props))
  }
  duplicate () {
    return new Layer({ energy: this.energy, trace: this.trace })
  }
  slice (range) {
    if (!range) throw new Error('[Layer slice] Empty range prop')

    var startIndex = range[0] >= 0 && range[0] <= this.trace.x.length ? range[0] : 0
    var endIndex = range[1] >= startIndex && range[1] < this.trace.x.length ? range[1] : this.trace.x.length - 1
    var startX = this.trace.x[startIndex]
    var endX = this.trace.x[endIndex]
    var trace = { x: this.trace.x.slice(startIndex, endIndex + 1), y: this.trace.y.slice(startIndex, endIndex + 1) }
    if (!this.energy) return new Layer(Object.assign({}, this, { trace }))

    var energyStartIndex = -1
    var energyEndIndex = -1

    if (this.energy.mids) {
      energyStartIndex = this.energy.mids.findIndex(m => m >= startIndex)
      energyEndIndex = this.energy.mids.findIndex(m => m > endIndex) - 1
    } else {
      energyStartIndex = this.energy.x.findIndex(x => x >= startX)
      energyEndIndex = this.energy.x.findIndex(x => x > endX) - 1
    }

    var energy = {}
    energy.values = [this.getEnergyAtIndex(startIndex), ...this.energy.values.slice(energyStartIndex, energyEndIndex + 1), this.getEnergyAtIndex(endIndex)]
    if (this.energy.mids) energy.mids = [0, ...this.energy.mids.slice(energyStartIndex, energyEndIndex + 1).map(v => v - startIndex), endIndex - startIndex]
    if (this.energy.x) energy.x = [startX, ...this.energy.x.slice(energyStartIndex, energyEndIndex + 1), endX]

    return new Layer(Object.assign({}, this, { trace, energy }))
  }
  sliceAndMerge (ranges) {
    if (!ranges || !Array.isArray(ranges)) throw new Error('[Layer sliceAndMerge] Invalid prop ranges')
    var trace = { x: [], y: [] }
    var energy
    if (this.energy) energy = { values: [] }
    if (this.energy && this.energy.x) energy.x = []
    if (this.energy && this.energy.mids) energy.mids = []

    ranges.forEach(r => {
      var sliced = this.slice(r)
      var slicedLen = sliced.trace.x.length
      var offset = trace.x.length
      if (slicedLen < 1) return
      trace.x = [...trace.x, ...sliced.trace.x, sliced.trace.x[slicedLen - 1] + 0.000001]
      trace.y = [...trace.y, ...sliced.trace.y, null]
      if (sliced.energy) {
        energy.values = [...energy.values, ...sliced.energy.values, null]
        if (energy.mids) energy.mids = [...energy.mids, ...sliced.energy.mids.map(m => m + offset), trace.x.length - 1]
        if (energy.x) energy.x = [...energy.x, ...sliced.energy.x, trace.x[trace.x.length - 1]]
      }
    })
    return new Layer(Object.assign({}, this, { trace, energy }))
  }
  moveX (value) {
    if (!Number.isFinite(value)) throw new Error('[Layer moveX] Invalid value prop')
    var trace = {
      y: this.trace.y,
      x: this.trace.x.map(x => x + value)
    }
    var energy = this.energy
    if (energy && energy.x) {
      energy.x = energy.x.map(x => x + value)
    }
    return new Layer(Object.assign({}, this, { trace, energy }))
  }
  download () {
    var json = JSON.stringify({ trace: this.trace, energy: this.energy, name: this.name, color: this.color })
    saveAs(new Blob([json], { type: 'application/json', name: this.name + '.json' }), this.name + '.json')
  }
  getEnergyAtIndex (index) {
    if (!this.energy) throw new Error('[Layer getEnergyAtIndex] This layer does not have energy')
    if (index >= this.trace.x.length || index < 0) throw new Error('[Layer getEnergyAtIndex] Invalid index: ' + index)
    var beforeEnergyIndex
    var afterEnergyIndex
    if (this.energy.mids) {
      beforeEnergyIndex = this.energy.mids.findIndex(m => m > index) - 1
      if (beforeEnergyIndex === -2) beforeEnergyIndex = this.energy.mids.length - 1
      afterEnergyIndex = this.energy.mids.findIndex(m => m >= index)
    } else {
      beforeEnergyIndex = this.energy.x.findIndex(x => x > this.trace.x[index]) - 1
      if (beforeEnergyIndex === -2) beforeEnergyIndex = this.energy.x.length - 1
      afterEnergyIndex = this.energy.x.findIndex(x => x >= this.trace.x[index])
    }
    if (beforeEnergyIndex < 0 && afterEnergyIndex < 0) throw new Error('[Layer getEnergyAtIndex] There is no energy point before and after index: ' + index)
    if (beforeEnergyIndex < 0) beforeEnergyIndex = afterEnergyIndex
    if (afterEnergyIndex < 0) afterEnergyIndex = beforeEnergyIndex
    return (this.energy.values[beforeEnergyIndex] + this.energy.values[afterEnergyIndex]) / 2
  }
}
export default Layer
