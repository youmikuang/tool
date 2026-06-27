module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'esbuild') {
        return pkg
      }
      return pkg
    }
  }
}