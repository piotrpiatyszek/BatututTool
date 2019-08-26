var fields = [
  {
    name: 'abc',
    type: 'Float',
    desc: 'test test',
    value: 12
  },
  {
    name: 'abc2',
    type: 'Integer',
    desc: 'test 2',
    value: 1111
  }
]
export default {
  getSchema () {
    var schema = {}
    fields.forEach(f => { schema[f.name] = Object.assign({}, f) })
    return schema
  },
  getDefaultConfig () {
    var conf = {}
    fields.forEach(f => { conf[f.name] = f.value })
    return conf
  },
  validate (config) {
    if (!config) return false
    fields.forEach(f => {
      if (f.type === 'Float') {
        if (!Number.isFinite(config[f.name])) return false
      } else if (f.type === 'Integer') {
        if (!Number.isInteger(config[f.name])) return false
      }
    })
    return true
  }
}
