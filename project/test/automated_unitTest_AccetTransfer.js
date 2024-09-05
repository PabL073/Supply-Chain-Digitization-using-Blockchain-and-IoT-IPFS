const Provenance = artifacts.require("Provenance")

let provenanceInstance

contract("Provenance", (accounts) => {
  let provenanceInstance

  before(async () => {
    provenanceInstance = await Provenance.deployed()
  })

  it("should accept a shipment transfer correctly", async () => {
    const initialOwner = accounts[0]
    const newOwner = accounts[1]
    const serialNo = "SHIP001"
    const newIpfsCid = "QmNewCid"

    // First, initiate a transfer to set the stage for acceptance
    await provenanceInstance.initiateShipmentTransfer(serialNo, newOwner, {
      from: initialOwner,
    })

    // Accept the transfer as the new owner
    const tx = await provenanceInstance.acceptShipmentTransfer(
      serialNo,
      newIpfsCid,
      { from: newOwner }
    )

    // Verify the new ownership and updated IPFS CID
    const updatedOwner = await provenanceInstance.shipmentOwners(serialNo)
    assert.equal(
      updatedOwner,
      newOwner,
      "The new owner should now be registered as the owner"
    )

    const updatedCid = await provenanceInstance.getShipmentCID(serialNo)
    assert.equal(
      updatedCid,
      newIpfsCid,
      "The IPFS CID should be updated to the new value"
    )

    // Check events
    truffleAssert.eventEmitted(tx, "ShipmentTransferAccepted", (ev) => {
      return ev.serialNo === serialNo && ev.newOwner === newOwner
    })
    truffleAssert.eventEmitted(tx, "ShipmentOwnershipTransferred", (ev) => {
      return (
        ev.serialNo === serialNo &&
        ev.from === initialOwner &&
        ev.to === newOwner
      )
    })
  })
})
