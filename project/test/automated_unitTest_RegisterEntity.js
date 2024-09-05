const Provenance = artifacts.require("Provenance")

contract("Register Entity Tests", (accounts) => {
  let provenanceInstance

  before(async () => {
    provenanceInstance = await Provenance.deployed()
  })

  it("should register an entity correctly", async () => {
    await provenanceInstance.registerEntity(
      accounts[1],
      1, // Role.Supplier
      "Supplier One",
      "Location One",
      false,
      "https://link-to-cert.com",
      { from: accounts[0] }
    )

    const entity = await provenanceInstance.getEntityDetails(accounts[1])
    assert(entity.isRegistered, "Entity should be registered")
    assert.equal(entity.name, "Supplier One", "Entity name should match")
    assert.equal(
      entity.location,
      "Location One",
      "Entity location should match"
    )
    assert.equal(entity.role, 1, "Entity role should match")
    assert.equal(entity.isCertified, false, "Entity certification should match")
  })
})
