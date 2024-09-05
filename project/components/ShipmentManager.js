//______________________Final Implementation______________________

import React, { useState, useEffect } from "react"
import useWeb3 from "../hooks/useWeb3"
import { useUser } from "../context/EntityData"
import LoadingSpinner from "./LoadingSpinner"
import CustomAlert from "./CustomAlert"
import { useWeb3StorageClient } from "../context/Web3StorageClientContext"
import { color } from "framer-motion"

function ShipmentManager({ onBack }) {
  const { user } = useUser()
  const { contract, accounts, web3, address } = useWeb3()
  const { client } = useWeb3StorageClient()
  const [viewMode, setViewMode] = useState("")
  const [serialNo, setSerialNo] = useState("")
  const [recipient, setRecipient] = useState("")
  const [newOwner, setNewOwner] = useState("")
  const [transferSerial, setTransferSerial] = useState([])
  const [productSerialNo, setProductSerialNo] = useState("")
  const [owners, setOwners] = useState("")
  const [locations, setLocations] = useState("")
  const [history, setHistory] = useState("")
  const [currentLocation, setCurrentLocation] = useState("")
  const [shipmentSerialNo, setShipmentSerialNo] = useState("")
  const [ipfsCid, setIpfsCid] = useState("")
  const [shipments, setShipments] = useState([])
  const [registeredEntities, setRegisteredEntities] = useState([])
  const [shipmentDetails, setShipmentDetails] = useState({})
  const [personalShipments, setPersonalShipments] = useState([])
  const [entityDetails, setEntityDetails] = useState(null)

  const [pendingTransfers, setPendingTransfers] = useState([])
  const [hoveredItem, setHoveredItem] = useState(null)
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: "" })
  const [loading, setLoading] = useState(false)

  const Role = {
    0: "Supplier",
    1: "Producer",
    2: "Transporter",
    3: "Warehouse",
    4: "Market",
  }

  const shipmentDetailsKeys = [
    "shipmentSerialNo",
    "recipient",
    "startLocation",
    "productSerialNo",
    "owners",
    "locations",
    "history",
    "temperatureLogs",
    "ISSUES",
  ]

  useEffect(() => {
    if (contract && accounts.length > 0) {
      console.log("Contract loaded:", contract)
      fetchShipments()
      handleShowPendingTransfers()
    }
  }, [contract, web3, accounts, address])

  // Function to close the custom alert
  const closeAlert = () => {
    setAlertInfo({ isOpen: false, message: "" })
  }

  const fetchShipments = async () => {
    try {
      setLoading(true)
      const serialNumbers = await contract.methods
        .getAllShipmentSerialNumbers()
        .call()
      setShipments(serialNumbers.map((serial) => ({ serial })))

      const personalShipments = await contract.methods
        .getOwnedShipments(accounts[0])
        .call()
      setPersonalShipments(personalShipments.map((serial) => ({ serial })))
    } catch (error) {
      console.error("Transaction failed:", error)
      if (error.code === 4001) {
        showAlert("Transaction rejected by the user")
      } else if (error.data && error.data.message) {
        showAlert("Transaction failed: " + error.data.message)
      } else {
        showAlert("Transaction failed: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  const fetchShipmentDetails = async (serial) => {
    setLoading(true)
    console.log("Fetching shipment details for serial number:", serial)

    try {
      const cid = await contract.methods.shipmentCIDs(serial).call()
      console.log("Fetched CID from blockchain:", cid)
      const url = `https://${cid}.ipfs.w3s.link` // Construct the URL to access the file
      const response = await fetch(url) // Fetch the JSON file from IPFS
      if (!response.ok) throw new Error("Failed to fetch JSON from IPFS")
      const jsonDetails = await response.json() // Parse the JSON data

      setShipmentDetails(jsonDetails) // Update state
      console.log("Fetched shipment details:", jsonDetails)

      setOwners(jsonDetails.owners)
      console.log("Owners:", owners)

      const ownersArray =
        shipmentDetails && shipmentDetails.owners
          ? Object.values(shipmentDetails.owners)
          : []
      setOwners(ownersArray)

      setTimeout(() => {
        console.log("Updated Shipment Owners:", owners)
      }, 3000)

      // Asynchronous log to see updated state
      setTimeout(() => {
        console.log(
          ")))TMP - Updated Temperature Logs:",
          shipmentDetails.temperatureLogs
        )
      }, 1000)

      setShipmentSerialNo(serial)
      setViewMode("details")
    } catch (error) {
      console.error("Failed to fetch shipment details:", error)
      showAlert("Failed to fetch shipment details: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateShipment = async () => {
    if (!contract || accounts.length === 0) {
      showAlert("No blockchain contract loaded or no account connected.")
      return
    }

    if (!serialNo || !recipient || !productSerialNo || !currentLocation) {
      showAlert("All fields are required.")
      return
    }
    const productCid = await contract.methods
      .getProductCID(productSerialNo)
      .call()
    // load the product details from ipfs
    const url = `https://${productCid}.ipfs.w3s.link` // Construct the URL to access the file

    setViewMode("add")
    setLoading(true)

    const date = new Date().toISOString()
    const startLocation = currentLocation

    console.log("Creating shipment with serial number:", serialNo)

    const newOwner = {
      address: accounts[0],
      timestamp: new Date().toISOString(),
    }
    let newHistory = {
      history: "Shipment created",
      timestamp: date,
    }

    const newLocation = {
      location: startLocation,
      timestamp: new Date().toISOString(),
    }

    const newProduct = {
      productSerialNo: productSerialNo,
      URL: url,
    }

    const initialShipmentData = {
      synced: date,
      shipmentSerialNo: serialNo,
      recipient: recipient,
      startLocation: currentLocation,
      productSerialNo: newProduct,
      owners: [newOwner], // Initial owner with timestamp
      locations: [newLocation], // Initial location with timestamp
      history: [newHistory], // Empty history array
      temperatureLogs: [], // Empty temperature logs array
      ISSUES: [], // Placeholder for issues, can be updated later
      ALERTS: [], // Placeholder for alerts, can be updated later
    }

    const jsonData = JSON.stringify(initialShipmentData, null, 2)

    const blob = new Blob([jsonData], { type: "application/json" })
    const file = new File([blob], `${serialNo}.json`, {
      type: "application/json",
    })

    try {
      if (file && client) {
        const fileCid = await client.uploadFile(file)
        const CID = fileCid.toString()
        console.log("Uploaded to IPFS with CID:", CID)

        const transactionObject = {
          from: accounts[0],
          to: contract.options.address,
          gas: 3000000,
          //gasPrice: 0,
          data: contract.methods
            .addShipment(serialNo, CID, accounts[0])
            .encodeABI(),
        }

        let response = await web3.eth.sendTransaction(transactionObject)
        console.log("Transaction successful:", response)
      }
    } catch (error) {
      console.error("Transaction failed:", error)
      if (error.code === 4001) {
        showAlert("Transaction rejected by the user")
      } else if (error.data && error.data.message) {
        showAlert("Transaction failed: " + error.data.message)
      } else {
        showAlert("Transaction failed: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateTransfer = async () => {
    if (!contract || accounts.length === 0) {
      // showAlert("No blockchain contract loaded or no account connected.")
      return
    }
    setViewMode("transfer")
    setLoading(true)
    try {
      console.log("serialNo:", transferSerial)
      console.log("newOwner:", newOwner)

      const transactionObject = {
        from: accounts[0],
        to: contract.options.address,
        gas: 3000000,
        //gasPrice: 0,
        data: contract.methods
          .initiateShipmentTransfer(transferSerial, newOwner)
          .encodeABI(),
      }

      const response = await web3.eth.sendTransaction(transactionObject)
      console.log("Transaction successful:", response)
      showAlert("Shipment transfer initiated successfully!")
    } catch (error) {
      console.error("Transaction failed:", error)
      if (error.code === 4001) {
        showAlert("Transaction rejected by the user")
      } else if (error.data && error.data.message) {
        showAlert("Transaction failed: " + error.data.message)
      } else {
        showAlert("Transaction failed: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function handleShowEntities() {
      if (!contract || accounts.length === 0) {
        // showAlert("No blockchain contract loaded or no account connected.")
        return
      }
      setViewMode("entities")

      try {
        const entities = await contract.methods
          .getAllRegisteredEntities()
          .call()
        // console.log("Entities:", entities)
        setRegisteredEntities(entities)
        if (entities.length !== 0) {
          setLoading(false)
        }
        // showAlert("Entities loaded successfully!")
      } catch (error) {
        console.error("Error fetching entities:", error)
        showAlert("Failed to fetch entities: " + error.message)
      } finally {
      }
    }

    handleShowEntities()
  }, [contract, accounts])

  const handleAcceptTransfer = async (transfer) => {
    if (!contract || accounts.length === 0) {
      // showAlert("No blockchain contract loaded or no account connected.")
      return
    }
    setLoading(true)

    try {
      const serialNo = transfer.toString() // Ensuring transfer is treated as a string
      console.log("serialNo:", serialNo)

      const cid = await contract.methods.getShipmentCID(serialNo).call()
      console.log("Fetched CID from blockchain:", cid)

      const url = `https://${cid}.ipfs.w3s.link` // Construct the URL to access the file
      const response = await fetch(url) // Fetch the JSON file from IPFS
      if (!response.ok) throw new Error("Failed to fetch JSON from IPFS")

      const jsonDetails = await response.json() // Parse the JSON data
      setShipmentDetails(jsonDetails)

      // Update the ownership array with new owner and timestamp
      const newOwner = {
        address: accounts[0],
        timestamp: new Date().toISOString(),
      }

      const newHistory = {
        history: "Shipment transfer accepted! : " + url,
        timestamp: new Date().toISOString(),
      }
      let date = new Date().toISOString()

      // Prepare new data to be added to IPFS
      const updatedDetails = {
        ...jsonDetails,
        synced: date,
        owners: [...jsonDetails.owners, newOwner], // Append new owner with timestamp
        locations: [...jsonDetails.locations], // Append new location with timestamp
        history: [...jsonDetails.history, newHistory], // Append new history record
      }

      // Convert the updated details into a JSON string
      const jsonData = JSON.stringify(updatedDetails, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const file = new File([blob], `${serialNo}.json`) // Using serial number as the file name

      if (file && client) {
        const fileCid = await client.uploadFile(file) // Pass the File directly
        const CID = fileCid.toString()
        console.log("Uploaded to IPFS with CID:", CID)

        // Call the smart contract method to accept the transfer
        const transactionResponse = await contract.methods
          .acceptShipmentTransfer(serialNo, CID)
          .send({ from: accounts[0], gas: 3000000 })

        console.log("Transaction successful:", transactionResponse)
      }
    } catch (error) {
      console.error("Transaction failed:", error)
      if (error.code === 4001) {
        showAlert("Transaction rejected by the user")
      } else {
        showAlert(`Transaction failed: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRejectTransfer = async (transfer) => {
    if (!contract || accounts.length === 0) {
      // showAlert("No blockchain contract loaded or no account connected.")
      return
    }
    setLoading(true)

    let transfer2 = transfer.toString()
    try {
      const cid = await contract.methods.getShipmentCID(transfer2).call()

      const url = `https://${cid}.ipfs.w3s.link` // Construct the URL to access the file

      const response = await fetch(url) // Fetch the JSON file from IPFS
      if (!response.ok) throw new Error("Failed to fetch JSON from IPFS")
      const jsonDetails = await response.json() // Parse the JSON data

      setShipmentDetails(jsonDetails)
      let newHistory = {
        history: " Shipment transfer rejected! : " + url,
        timestamp: new Date().toISOString(),
      }

      let date = new Date().toISOString()

      let new_issue = {
        issue: "Rejected Transfer",
        timestamp: date,
      }

      const jsonData = JSON.stringify({
        ...jsonDetails,
        synced: date,
        history: [...jsonDetails.history, newHistory],
        ISSUES: [...jsonDetails.ISSUES, new_issue],
      })

      const blob = new Blob([jsonData], { type: "application/json" })
      const file = new File([blob], `${serialNo}.json`) // Using serial number as the file name
      if (file && client) {
        // Correct usage of uploadFile
        const fileCid = await client.uploadFile(file) // Pass the File directly

        const CID = fileCid.toString()

        const response = await contract.methods
          .rejectShipmentTransfer(transfer2, CID)
          .send({ from: accounts[0], gas: 3000000 })

        console.log("Transaction successful:", response)
      }
    } catch (error) {
      console.error("Transaction failed:", error)
      if (error.code === 4001) {
        showAlert("Transaction rejected by the user")
      } else if (error.data && error.data.message) {
        showAlert("Transaction failed: " + error.data.message)
      } else {
        showAlert("Transaction failed: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogData = async () => {
    if (!contract || accounts.length === 0) {
      // showAlert("No blockchain contract loaded or no account connected.")
      return
    }
    setLoading(true)

    //generate random temperature between -10 and 5
    const temperature = Math.floor(Math.random() * 16) - 10

    try {
      const response = await contract.methods
        .logTemperature(serialNo, temperature)
        .send({
          from: accounts[0],
          gas: 3000000,
          //gasPrice: 0,
        })

      showAlert("Temperature logged successfully!")
      console.log("Transaction successful:", response)
    } catch (error) {
      console.error("Failed to log temperature:", error)
      if (error.code === 4001) {
        showAlert("Transaction rejected by the user")
      } else if (error.data && error.data.message) {
        showAlert("Transaction failed: " + error.data.message)
      } else {
        showAlert("Transaction failed: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }
  // Function to convert logs
  function transformLogs(logs) {
    return logs.map((log) => {
      // Convert BigInt timestamp to a JavaScript Date object
      const date = new Date(Number(log[0]) * 1000) // Multiply by 1000 if the timestamp is in seconds
      const temperature = Number(log[1]) // Convert BigInt temperature to a number

      // Format date using toLocaleString or any other preferred method
      const formattedDate = date.toLocaleString() // Default formatting

      return {
        date: formattedDate,
        temperature: temperature,
      }
    })
  }

  function trnsformAlert(alerts) {
    return alerts.map((alert) => {
      const date = new Date(Number(alert[0]) * 1000)
      const issue = Number(alert[1])

      console.log("Issue:", issue)
      console.log("Date:", date)
      const formattedDate = date.toLocaleString()

      return {
        date: formattedDate,
        alert: issue,
      }
    })
  }

  const fetchEntityDetails = async (entityAddress) => {
    try {
      if (contract) {
        const details = await contract.methods
          .getEntityDetails(entityAddress)
          .call()
        setEntityDetails(details)
      }
    } catch (error) {
      console.error("Error fetching entity details:", error)
    }
  }

  const handleSyncCID = async () => {
    if (!contract || accounts.length === 0) {
      // showAlert("No blockchain contract loaded or no account connected.")
      return
    }
    setViewMode("sync")
    setLoading(true)

    console.log("Serial No:", serialNo)

    try {
      const cid = await contract.methods.getShipmentCID(serialNo).call()
      console.log("Fetched CID from blockchain:", cid)
      const url = `https://${cid}.ipfs.w3s.link` // Construct the URL to access the file

      const response = await fetch(url) // Fetch the JSON file from IPFS
      if (!response.ok) throw new Error("Failed to fetch JSON from IPFS")
      const jsonDetails = await response.json() // Parse the JSON data

      setShipmentDetails(jsonDetails)

      console.log("Fetched shipment details:", jsonDetails)

      // Fetch temperature logs
      const temp = await contract.methods.getTemperatureLogs(serialNo).call()
      const temperatureLogs = transformLogs(temp) // Ensure this returns an array
      const date = new Date().toISOString()

      let newHistory = {
        history: url,
        timestamp: date,
      }

      let newLocation = {
        location: currentLocation,
        timestamp: date,
      }

      const Balerts = await contract.methods.getAlerts(serialNo).call()

      console.log("New Location:", newLocation)

      const alerts = trnsformAlert(Balerts)
      console.log("Alerts:", alerts)

      // Create the updated shipment details object
      const updatedShipmentDetails = {
        ...jsonDetails,
        synced: `[${date}]`,
        locations: [...jsonDetails.locations, newLocation],
        history: [...jsonDetails.history, newHistory],
        ALERTS: alerts,
        temperatureLogs: temperatureLogs,
      }

      // Set the updated shipment details to state or handle it as needed
      setShipmentDetails(updatedShipmentDetails)

      const jsonData = JSON.stringify(updatedShipmentDetails)
      const blob = new Blob([jsonData], { type: "application/json" })
      const file = new File([blob], `${serialNo}.json`) // Using serial number as the file name

      if (file && client) {
        const fileCid = await client.uploadFile(file) // Pass the File directly
        const CID = fileCid.toString()
        console.log("Uploaded to IPFS with CID:", CID)

        const transactionObject = {
          from: accounts[0],
          to: contract.options.address,
          gas: 3000000,
          //gasPrice: 0,
          data: contract.methods.updateShipmentCID(serialNo, CID).encodeABI(),
        }

        const transactionResponse = await web3.eth.sendTransaction(
          transactionObject
        )
        showAlert("Shipment CID synced successfully!")
        console.log("Transaction successful:", transactionResponse)
      }
    } catch (error) {
      console.error("Failed to fetch shipment details or sync CID:", error)

      if (error.code === 4001) {
        showAlert("Transaction rejected by the user")
      } else if (error.data && error.data.message) {
        showAlert("Transaction failed: " + error.data.message)
      } else {
        showAlert("Transaction failed: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }
  const handleShowPendingTransfers = async () => {
    if (!contract || accounts.length === 0) {
      return
    }
    setViewMode("pending")
    setLoading(true)
    try {
      const transfers = await contract.methods
        .getPendingTransfers(accounts[0])
        .call()
      setPendingTransfers(transfers)
    } catch (error) {
      console.error("Error fetching pending transfers:", error)
      showAlert("Failed to fetch pending transfers: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (message) => {
    setAlertInfo({ isOpen: true, message })
  }

  const handleBackToPending = () => {
    setViewMode("pending")
    setShipmentDetails(null)
  }

  const renderButtons = () => (
    <div style={style.buttonColumn}>
      <button style={style.button} onClick={() => setViewMode("add")}>
        Add New Shipment
      </button>
      <button style={style.button} onClick={() => setViewMode("personal")}>
        My Shipments
      </button>
      <button style={style.button} onClick={() => setViewMode("entities")}>
        List All Entities
      </button>
      <button style={style.button} onClick={() => setViewMode("transfer")}>
        Initiate Transfer
      </button>
      <button style={style.button} onClick={() => setViewMode("pending")}>
        Show Pending Transfers
      </button>
      <button style={style.button} onClick={() => setViewMode("sync")}>
        Sync CID
      </button>
      <button style={style.button} onClick={() => setViewMode("list")}>
        List Shipments
      </button>{" "}
      <button style={style.button} onClick={onBack}>
        ← Back
      </button>
    </div>
  )

  const renderEntitiesList = () => (
    <>
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <h3 style={{ ...style.textLarge }}>Registered Stakeholders</h3>
      </div>

      <div style={{ ...style.listContainer, justifyContent: "center" }}>
        <div style={style.listColumn}>
          {entities.map((entity) => (
            <div
              key={entity}
              style={{
                ...style.listItem,
                margin: "10px 0",
                borderRadius: "10px",
              }}
            >
              {entity}
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const ALERT_CODES = {
    1: "Temperature Alert",
    2: "Humidity Alert",
    3: "Shock Alert",
  }

  const renderPersonalShipments = () => (
    <>
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <h3 style={{ ...style.textLarge }}>My Shipments</h3>
      </div>

      <div style={{ ...style.listContainer, justifyContent: "center" }}>
        <div style={style.listColumn}>
          {personalShipments.map((pers) => (
            <div
              key={personalShipments.serial}
              style={{
                ...style.listItem,
                margin: "10px 0",
                borderRadius: "10px",
              }}
              onClick={() => {
                setViewMode("details")
                fetchShipmentDetails(pers.serial)
              }}
            >
              {pers.serial}
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const renderShipmentList = () => (
    <div style={style.listContainer}>
      <div style={style.listColumn}>
        {shipments.map((shipment) => {
          // Ensure shipment.serial is defined and unique
          if (!shipment.serial) {
            console.error("Undefined serial for shipment:", shipment)
            return null // or handle appropriately
          }
          return (
            <div
              key={shipment.serial}
              style={style.listItem}
              onClick={() => {
                setViewMode("details")
                fetchShipmentDetails(shipment.serial)
              }}
            >
              {shipment.serial}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderView = () => {
    switch (viewMode) {
      case "add":
        return (
          <div style={style.listColumn}>
            <CustomAlert
              message={alertInfo.message}
              isOpen={alertInfo.isOpen}
              onClose={closeAlert}
            />
            <input
              style={style.input}
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              //set style input focus on click
              placeholder='Shipment Serial Number'
            />
            <input
              style={style.input}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder='Recipient'
            />
            <input
              style={style.input}
              value={productSerialNo}
              onChange={(e) => setProductSerialNo(e.target.value)}
              placeholder='Product Serial Number'
            />
            <input
              style={style.input}
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder='Current Location'
            />
            <button
              style={{
                ...style.button,
              }}
              onClick={handleCreateShipment}
            >
              Create Shipment
            </button>
          </div>
        )

      case "personal":
        return (
          <div style={{ ...style.container, overflowY: "auto" }}>
            {loading ? <p>Loading...</p> : renderPersonalShipments()}
          </div>
        )

      case "entities":
        return (
          <div style={{ ...style.container, overflowY: "auto" }}>
            <>
              <h3
                style={{
                  fontSize: "28px",
                  color: "#333",
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  textAlign: "center",
                  margin: "10px",
                }}
              >
                Registered Entities
              </h3>

              <div>
                <ul
                  style={{
                    ...style.list,
                    overflowY: "auto", // Enables vertical scrolling
                    maxHeight: "300px", // Sets a maximum height to trigger scrolling
                    marginBottom: "20px", // Adds bottom margin for spacing
                  }}
                >
                  {registeredEntities.map((entity, index) => (
                    <li
                      key={index}
                      style={{ ...style.listItem, marginTop: 10 }}
                      onClick={() => fetchEntityDetails(entity)}
                    >
                      {entity}
                    </li>
                  ))}
                </ul>
                {/* <button style={{
                        ...style.button,
                        display: 'block',  // Ensures the button is a block element for margin auto to work
                        margin: '0 auto 20px'  // Centers the button horizontally and adds space below
                    }} onClick={() => }>← Back to menu</button> */}
                {entityDetails && (
                  <div
                    style={{
                      padding: "20px",
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      border: "1px solid #e0e0e0",
                      color: "#333",
                      lineHeight: "1.6",
                      fontSize: "16px",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    <p>
                      <strong>Address:</strong> {entityDetails.entityAddress}
                    </p>
                    <p>
                      <strong>Entity Name:</strong> {entityDetails.name}
                    </p>
                    <p>
                      <strong>Location:</strong> {entityDetails.location}
                    </p>
                    <p>
                      <strong>Role:</strong> {Role[entityDetails.role]}
                    </p>
                    <p>
                      <strong>Certified:</strong>{" "}
                      {entityDetails.isCertified ? "Certified" : "Uncertified"}
                    </p>
                    <p>
                      <strong>Certificate link:</strong>{" "}
                      <a
                        href={entityDetails.link}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          color: "#007bff",
                          textDecoration: "none",
                        }}
                      >
                        {entityDetails.link}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </>
          </div>
        )
      case "list":
        return (
          <div style={{ ...style.container, overflowY: "auto" }}>
            {loading ? <p>Loading...</p> : renderShipmentList()}
          </div>
        )

      case "details":
        return (
          <div
            style={{
              ...style.container,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "20px",
              margin: "10px",
              border: "1px solid #333",
              borderRadius: "8px",
              color: "#333",
              overflowY: "auto",
            }}
          >
            {loading && <p>Loading...</p>}
            {shipmentDetails && (
              <div>
                <p>
                  <strong>Serial Number:</strong> {shipmentSerialNo}
                </p>

                {shipmentDetails.ALERTS &&
                  shipmentDetails.ALERTS.length > 0 && (
                    <div>
                      {shipmentDetails.ALERTS.map((alert, index) => {
                        // If alert.alert is 0, skip rendering this particular alert
                        if (alert.alert === 0) {
                          return null
                        }

                        // Get the alert message from ALERT_CODES based on the alert code
                        const alertMessage =
                          ALERT_CODES[alert.alert] || "Unknown Alert"

                        return (
                          <p key={index} style={{ color: "red" }}>
                            <strong>ALERT:</strong> {alertMessage} -{" "}
                            {alert.date}
                          </p>
                        )
                      })}
                    </div>
                  )}

                {shipmentDetails.productSerialNo ? (
                  <div>
                    <strong>ITEMS:</strong>{" "}
                    {Array.isArray(shipmentDetails.productSerialNo) &&
                    shipmentDetails.productSerialNo.length > 0 ? (
                      <ul>
                        {shipmentDetails.productSerialNo.map(
                          (product, index) => (
                            <li key={product.productSerialNo + index}>
                              Product Serial No: {product.productSerialNo}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>No product data available.</p>
                    )}
                  </div>
                ) : (
                  <p>Loading product serial numbers...</p>
                )}

                {shipmentDetails && (
                  <div>
                    <strong>Owners:</strong>
                    {Array.isArray(shipmentDetails.owners) ? (
                      <ul>
                        {shipmentDetails.owners.map((owner, index) => (
                          <li key={owner.address + index}>
                            Address: {owner.address} - Timestamp:{" "}
                            {formatDate(owner.timestamp)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Loading owners or no owners data available.</p>
                    )}
                  </div>
                )}
                <p>
                  <strong>Recipient:</strong> {shipmentDetails.recipient}
                </p>
                <p>
                  <strong>Origin:</strong> {shipmentDetails.startLocation}
                </p>
                {Array.isArray(shipmentDetails.locations) ? (
                  <div>
                    <strong>Locations:</strong>
                    <ul>
                      {shipmentDetails.locations.map((loc, index) => (
                        <li key={loc.location + index}>
                          CITY: {loc.location} - Timestamp:{" "}
                          {formatDate(loc.timestamp)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>Loading locations or no location data available.</p>
                )}
                {shipmentDetails.history &&
                  shipmentDetails.history.length > 0 && (
                    <div>
                      <strong>History:</strong>
                      <ul>
                        {shipmentDetails.history.map((hist, index) => (
                          <li key={index}>
                            {" "}
                            {/* Using index as key if hist lacks a unique identifier */}
                            <span>
                              <strong>CheckPoint:</strong>{" "}
                              {hist.history || "No description"}
                            </span>{" "}
                            -{" "}
                            <span>
                              <strong>Timestamp:</strong>{" "}
                              {formatDate(hist.timestamp)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {shipmentDetails.ISSUES &&
                  shipmentDetails.ISSUES.length > 0 && (
                    <div>
                      <strong
                        style={{
                          color: "red",
                        }}
                      >
                        Issues:
                      </strong>
                      <ul>
                        {shipmentDetails.ISSUES.map((issue, index) => (
                          <li key={index}>
                            {" "}
                            {/* Move the key to the <li> element */}
                            <span>
                              <strong style={{ color: "red" }}>Issue:</strong>{" "}
                              {issue.issue}
                            </span>{" "}
                            -
                            <span>
                              <strong>Timestamp:</strong>{" "}
                              {formatDate(issue.timestamp)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {shipmentDetails &&
                Array.isArray(shipmentDetails.temperatureLogs) &&
                shipmentDetails.temperatureLogs.length > 0 ? (
                  <div>
                    <strong>Temperature Logs:</strong>
                    <ul>
                      {shipmentDetails.temperatureLogs.map((log, index) => (
                        <li key={index}>
                          <span>
                            <strong>time:</strong> {log.date}
                          </span>{" "}
                          -
                          <span>
                            <strong>Temperature:</strong> {log.temperature}°C
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>No Temperature Logs Available.</div>
                )}

                <button
                  style={minimalisticStyle.checkButton}
                  onClick={() => setViewMode("pending")}
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        )

      case "transfer":
        return (
          <div style={style.container}>
            <CustomAlert
              message={alertInfo.message}
              isOpen={alertInfo.isOpen}
              onClose={closeAlert}
            />
            <input
              style={style.input}
              value={transferSerial}
              onChange={(e) => setTransferSerial(e.target.value)}
              placeholder="Shipment's serial number"
            />

            <input
              style={style.input}
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="New Owner's Address"
            />

            <button style={style.button} onClick={handleInitiateTransfer}>
              Initiate
            </button>
          </div>
        )

      case "pending":
        return (
          <div style={{ ...style.list, ...style.textCenter }}>
            <CustomAlert
              message={alertInfo.message}
              isOpen={alertInfo.isOpen}
              onClose={closeAlert}
            />
            {viewMode === "pending" && (
              <div style={minimalisticStyle.container}>
                <h3 style={style.textLarge}>Pending Transfers</h3>
                {loading ? (
                  <p>Loading...</p>
                ) : pendingTransfers.length > 0 ? (
                  pendingTransfers.map((transfer, index) => (
                    <div key={index} style={minimalisticStyle.listItem}>
                      <p style={minimalisticStyle.serialNumber}>
                        Serial Number: {transfer}
                      </p>
                      <div style={minimalisticStyle.buttonGroup}>
                        <button
                          style={{
                            ...minimalisticStyle.button,
                            ...minimalisticStyle.checkButton,
                          }}
                          onClick={() => fetchShipmentDetails(transfer)}
                        >
                          Check History
                        </button>
                        <button
                          style={{
                            ...minimalisticStyle.button,
                            ...minimalisticStyle.acceptButton,
                          }}
                          onClick={() => handleAcceptTransfer(transfer)}
                        >
                          Accept
                        </button>
                        <button
                          style={{
                            ...minimalisticStyle.button,
                            ...minimalisticStyle.rejectButton,
                          }}
                          onClick={() => handleRejectTransfer(transfer)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ ...style.textCenter, color: "black" }}>
                    No pending transfers.
                  </p>
                )}
              </div>
            )}
          </div>
        )

      case "sync":
        return (
          <div style={style.container}>
            <CustomAlert
              message={alertInfo.message}
              isOpen={alertInfo.isOpen}
              onClose={closeAlert}
            />
            <input
              style={style.input}
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder='Shipment Serial Number'
            />
            <input
              style={style.input}
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder='Current Location'
            />

            <button style={style.button} onClick={handleSyncCID}>
              Sync
            </button>
            <button style={style.button} onClick={handleLogData}>
              Log Data
            </button>
          </div>
        )

      default:
        return <p style={style.textLarge}>Select an option to begin</p>
    }
  }

  const style = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      padding: "20px",
      backgroundColor: "#f4f4f8",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      // maxWidth: "800px", // Set a max width if necessary
      margin: "auto",
      maxHeight: "600px",
    },
    buttonColumn: {
      flex: "0 0 150px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "10px",
    },
    listContainer: {
      display: "flex",
      justifyContent: "flex-end", // Move the list to the right
      alignItems: "center",
      paddingRight: "20px", // Optional: Adjust for spacing from the right edge
    },
    listColumn: {
      flex: "1 1 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      overflowY: "auto",
      maxHeight: "300px",
      margin: "10px",
      padding: "10px",
    },
    button: {
      backgroundColor: "#007bff",
      color: "white",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      marginBottom: "10px",
      width: "200px", // Fixed width for consistent sizing
      height: "40px", // Optional: Fixed height for consistent vertical size
    },

    input: {
      margin: "5px",
      padding: "8px",
      width: "calc(100% - 22px)",
      boxSizing: "border-box",
    },
    inputFocus: {
      borderColor: "#0056b3",
      boxShadow: "0 0 8px #0056b3",
    },
    textCenter: {
      textAlign: "center",
    },
    textLarge: {
      fontSize: "26px",
      fontWeight: "bold",
      color: "#262626",
      textShadow: "1px 1px 3px rgba(0,0,0,0.1)",
    },
    list: {
      listStyleType: "none",
      width: "100%",
      maxWidth: "600px",
      maxHeight: "300px",
      overflowY: "auto",
      margin: "0 auto",
    },
    listItem: {
      cursor: "pointer",
      padding: "12px 18px",
      marginTop: "4px",
      backgroundColor: "#333333", // Changed to dark gray
      borderRadius: "6px",
      transition: "background-color 0.3s, transform 0.3s",
      display: "flex",
      // center the text in the item

      justifyContent: "space-between",
      alignItems: "center",
    },
    listItemHover: {
      backgroundColor: "#474747", // Slightly lighter gray on hover
      transform: "translateX(5px)",
    },
  }
  return (
    <div style={style.container}>
      {renderButtons()}

      {renderView()}

      {loading && <LoadingSpinner />}
      {/* {alertInfo.isOpen && (
        // <CustomAlert
        //   message={alertInfo.message}
        //   onClose={() => setAlertInfo({ isOpen: false, message: "" })}
        // />
      )} */}
    </div>
  )
}

export default ShipmentManager

const minimalisticStyle = {
  container: {
    padding: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    maxWidth: "600px",
    maxHeight: "50px",
    margin: "20px auto",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  listItem: {
    // padding: "8px",
    // margin: "8px 0",
    border: "1px solid #ddd",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#333",
  },
  serialNumber: {
    margin: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  buttonGroup: {
    display: "flex",
    gap: "6px",
  },
  button: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  checkButton: {
    backgroundColor: "#007bff",
    color: "white",
  },
  acceptButton: {
    backgroundColor: "green",
    color: "white",
  },
  rejectButton: {
    backgroundColor: "red",
    color: "white",
  },
}
