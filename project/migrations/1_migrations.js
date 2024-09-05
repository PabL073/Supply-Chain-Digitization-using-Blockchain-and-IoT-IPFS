const Provenance = artifacts.require("Provenance")

module.exports = function (deployer) {
  deployer.deploy(Provenance)
}
