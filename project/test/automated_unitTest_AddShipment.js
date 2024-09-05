const Provenance = artifacts.require("Provenance")

contract("Add Shipment Tests", (accounts) => {
  let provenanceInstance

  before(async () => {
    provenanceInstance = await Provenance.deployed()
    // Register a default owner for use in multiple tests
    await provenanceInstance.registerEntity(
      accounts[1],
      1,
      "Supplier One",
      "Location One",
      true,
      "https://link-to-cert.com",
      { from: accounts[0] }
    )
  })

  it("should add a shipment correctly", async () => {
    const owner = accounts[1]
    const serialNo = "SHIP001"
    const ipfsCid = "QmShipIpfsHash"

    await provenanceInstance.addShipment(serialNo, ipfsCid, owner, {
      from: owner,
    })

    const shipmentCID = await provenanceInstance.getShipmentCID(serialNo)
    assert.equal(
      shipmentCID,
      ipfsCid,
      "The IPFS CID should match the provided CID"
    )

    const shipmentOwner = await provenanceInstance.shipmentOwners(serialNo)
    assert.equal(
      shipmentOwner,
      owner,
      "The owner of the shipment should be correctly recorded"
    )
  })

  it("should prevent adding a shipment with a duplicate serial number", async () => {
    const owner = accounts[1]
    const serialNo = "SHIP001" // Attempting to reuse the serial number from the first test
    const ipfsCid = "QmAnotherIpfsHash"

    try {
      await provenanceInstance.addShipment(serialNo, ipfsCid, owner, {
        from: owner,
      })
      assert.fail("The transaction should have failed.")
    } catch (error) {
      assert.include(
        error.message,
        "Shipment already exists",
        "Expected failure for duplicate serial number."
      )
    }
  })

  it("should not allow non-registered entities to add a shipment", async () => {
    const nonRegistered = accounts[2] // Assume this account was never registered
    const serialNo = "SHIP002"
    const ipfsCid = "QmNewShipIpfsHash"

    try {
      await provenanceInstance.addShipment(serialNo, ipfsCid, nonRegistered, {
        from: nonRegistered,
      })
      assert.fail("The transaction should have failed.")
    } catch (error) {
      assert.include(
        error.message,
        "Entity is not registered",
        "Expected failure for non-registered entity."
      )
    }
  })

  it("should allow adding multiple distinct shipments for scaling", async () => {
    const owner = accounts[1]
    // Ensure both shipments have unique serial numbers
    await provenanceInstance.addShipment("SHIP003", "QmThirdIpfsHash", owner, {
      from: owner,
    })
    await provenanceInstance.addShipment("SHIP004", "QmFourthIpfsHash", owner, {
      from: owner,
    })

    const cidShip003 = await provenanceInstance.getShipmentCID("SHIP003")
    const cidShip004 = await provenanceInstance.getShipmentCID("SHIP004")

    assert.equal(
      cidShip003,
      "QmThirdIpfsHash",
      "IPFS CID for SHIP003 should match"
    )
    assert.equal(
      cidShip004,
      "QmFourthIpfsHash",
      "IPFS CID for SHIP004 should match"
    )
  })
})
