module.exports = {
  chainWebpack: config => {
    config.module
      .rule('ifyloader')
      .test(/\.js$/)
      .use('ify-loader')
        .loader('ify-loader')
        .end()
  }
}
