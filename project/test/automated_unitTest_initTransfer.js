const Provenance = artifacts.require("Provenance")

contract("Initiate Shipment Transfer Tests", (accounts) => {
  let provenanceInstance

  before(async () => {
    provenanceInstance = await Provenance.deployed()
  })

  it("should initiate a shipment transfer correctly", async () => {
    const owner = accounts[0]
    const newOwner = accounts[1]
    const serialNo = "SHIP001"

    // Setup for the test: Register new owner and add shipment
    await provenanceInstance.registerEntity(
      newOwner,
      1,
      "New Entity",
      "Location Two",
      true,
      "link",
      { from: owner }
    )
    await provenanceInstance.addShipment(serialNo, "QmShipIpfsHash", owner, {
      from: owner,
    })

    // Initiate the transfer
    const tx = await provenanceInstance.initiateShipmentTransfer(
      serialNo,
      newOwner,
      { from: owner }
    )

    // Check for emitted event and pending transfer status
    truffleAssert.eventEmitted(tx, "ShipmentTransferInitiated", (ev) => {
      return ev.serialNo === serialNo && ev.newOwner === newOwner
    })
    const isPending = await provenanceInstance.pendingSerialNumbers(serialNo)
    assert(isPending, "Shipment should be marked as pending for transfer")
  })
})
