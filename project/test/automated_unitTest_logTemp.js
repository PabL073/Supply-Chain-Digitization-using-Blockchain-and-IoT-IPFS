const Provenance = artifacts.require("Provenance")

contract("Log Temperature Tests", (accounts) => {
  let provenanceInstance
  const admin = accounts[0] // Assuming account[0] is the admin
  const owner = accounts[1]
  const nonOwner = accounts[2]
  const serialNo = "SHIP001"
  const temperature = 25

  before(async () => {
    provenanceInstance = await Provenance.deployed()
    // Register the owner as an entity and add a shipment for logging temperature
    await provenanceInstance.registerEntity(
      owner,
      1,
      "Owner Entity",
      "Location One",
      true,
      "https://link-to-cert.com",
      { from: admin }
    )
    await provenanceInstance.addShipment(serialNo, "QmShipIpfsHash", owner, {
      from: owner,
    })
  })

  it("should allow the owner to log temperature", async () => {
    // Log temperature as the owner
    const tx = await provenanceInstance.logTemperature(serialNo, temperature, {
      from: owner,
    })

    // Check the temperature log
    const logs = await provenanceInstance.getTemperatureLogs(serialNo)
    const lastLog = logs[logs.length - 1]
    assert.equal(
      lastLog.temperature,
      temperature,
      "The logged temperature should match the input"
    )
  })

  it("should allow the admin to log temperature", async () => {
    // Log temperature as the admin
    const tx = await provenanceInstance.logTemperature(serialNo, temperature, {
      from: admin,
    })
  })

  it("should not allow non-owners or non-admins to log temperature", async () => {
    try {
      await provenanceInstance.logTemperature(serialNo, temperature, {
        from: nonOwner,
      })
      assert.fail(
        "Non-owners or non-admins should not be able to log temperature"
      )
    } catch (error) {
      assert.include(
        error.message,
        "Only the shipment's owner or admin can perform this action",
        "Should throw correct error"
      )
    }
  })
})
