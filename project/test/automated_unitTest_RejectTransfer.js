const Provenance = artifacts.require("Provenance")

contract("Provenance", (accounts) => {
  let provenanceInstance

  before(async () => {
    provenanceInstance = await Provenance.deployed()
  })

  it("should reject a shipment transfer correctly", async () => {
    const initialOwner = accounts[0]
    const supposedNewOwner = accounts[1]
    const serialNo = "SHIP001"
    const newIpfsCid = "QmRejectedCid"

    // Simulate the scenario where a transfer has already been initiated
    await provenanceInstance.initiateShipmentTransfer(
      serialNo,
      supposedNewOwner,
      { from: initialOwner }
    )

    // Now reject the transfer as the supposed new owner
    const tx = await provenanceInstance.rejectShipmentTransfer(
      serialNo,
      newIpfsCid,
      { from: supposedNewOwner }
    )

    // Ensure the ownership has not changed and the IPFS CID is updated as part of the rejection process
    const ownerPostRejection = await provenanceInstance.shipmentOwners(serialNo)
    assert.equal(
      ownerPostRejection,
      initialOwner,
      "Ownership should remain with the initial owner"
    )

    const cidPostRejection = await provenanceInstance.getShipmentCID(serialNo)
    assert.equal(
      cidPostRejection,
      newIpfsCid,
      "The IPFS CID should be updated to the new value post-rejection"
    )

    // Check the event to confirm rejection
    truffleAssert.eventEmitted(tx, "ShipmentTransferRejected", (ev) => {
      return ev.serialNo === serialNo && ev.rejector === supposedNewOwner
    })
  })
})
