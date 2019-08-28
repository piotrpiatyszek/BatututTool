var fields = [
  { name: 'frame_length', type: 'Float', value: 35.0, desc: 'Length of each analysis frame (ms)' },
  { name: 'tda_frame_length', type: 'Float', value: 35.0, desc: 'Frame length employed in the time domain analysis (ms)' },
  { name: 'frame_space', type: 'Float', value: 10.0, desc: 'Spacing between analysis frames (ms)' },
  { name: 'f0_min', type: 'Float', value: 60.0, desc: 'Minimum F0 searched (Hz)' },
  { name: 'f0_max', type: 'Float', value: 400.0, desc: 'Maximum F0 searched (Hz)' },
  { name: 'fft_length', type: 'Integer', value: 8192, desc: 'FFT length' },
  { name: 'bp_forder', type: 'Integer', value: 150, desc: 'Order of band-pass filter' },
  { name: 'bp_low', type: 'Float', value: 50.0, desc: 'Low frequency of filter passband (Hz)' },
  { name: 'bp_high', type: 'Float', value: 1500.0, desc: 'High frequency of filter passband (Hz)' },
  { name: 'nlfer_thresh1', type: 'Float', value: 0.75, desc: 'NLFER boundary for voiced/unvoiced decisions' },
  { name: 'nlfer_thresh2', type: 'Float', value: 0.1, desc: 'Threshold for NLFER definitely unvoiced' },
  { name: 'shc_numharms', type: 'Integer', value: 3, desc: 'Number of harmonics in SHC calculation' },
  { name: 'shc_window', type: 'Float', value: 40.0, desc: 'SHC window length (Hz)' },
  { name: 'shc_maxpeaks', type: 'Integer', value: 4, desc: 'Maximum number of SHC peaks to be found' },
  { name: 'shc_pwidth', type: 'Float', value: 50.0, desc: 'Window width in SHC peak picking (Hz)' },
  { name: 'shc_thresh1', type: 'Float', value: 5.0, desc: 'Threshold 1 for SHC peak picking' },
  { name: 'shc_thresh2', type: 'Float', value: 1.25, desc: 'Threshold 2 for SHC peak picking' },
  { name: 'f0_double', type: 'Float', value: 150.0, desc: 'F0 doubling decision threshold (Hz)' },
  { name: 'f0_half', type: 'Float', value: 150.0, desc: 'F0 halving decision threshold (Hz)' },
  { name: 'dp5_k1', type: 'Float', value: 11.0, desc: 'Weight used in dynamic program' },
  { name: 'dec_factor', type: 'Integer', value: 1, desc: 'Factor for signal resampling' },
  { name: 'nccf_thresh1', type: 'Float', value: 0.3, desc: 'Threshold for considering a peak in NCCF' },
  { name: 'nccf_thresh2', type: 'Float', value: 0.9, desc: 'Threshold for terminating serach in NCCF' },
  { name: 'nccf_maxcands', type: 'Integer', value: 3, desc: 'Maximum number of candidates found' },
  { name: 'nccf_pwidth', type: 'Integer', value: 5, desc: 'Window width in NCCF peak picking' },
  { name: 'merit_boost', type: 'Float', value: 0.20, desc: 'Boost merit' },
  { name: 'merit_pivot', type: 'Float', value: 0.99, desc: 'Merit assigned to unvoiced candidates indefintely unvoiced frames' },
  { name: 'merit_extra', type: 'Float', value: 0.4, desc: 'Merit assigned to extra candidates in reducing F0 doubling/halving errors' },
  { name: 'median_value', type: 'Integer', value: 7, desc: 'Order of medial filter' },
  { name: 'dp_w1', type: 'Float', value: 0.15, desc: 'DP weight factor for V-V transitions' },
  { name: 'dp_w2', type: 'Float', value: 0.5, desc: 'DP weight factor for V-UV or UV-V transitions' },
  { name: 'dp_w3', type: 'Float', value: 0.1, desc: 'DP weight factor of UV-UV transitions' },
  { name: 'dp_w4', type: 'Float', value: 0.9, desc: 'Weight factor for local costs' }
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
