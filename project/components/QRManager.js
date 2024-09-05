import React, { useState, useEffect } from "react"
import useWeb3 from "../hooks/useWeb3"
import { useUser } from "../context/EntityData"
import LoadingSpinner from "./LoadingSpinner"
import CustomAlert from "./CustomAlert"
import { useWeb3StorageClient } from "../context/Web3StorageClientContext"
import { color } from "framer-motion"
import QRCode from "qrcode.react"

const ALERT_CODES = {
  1: "Temperature Alert",
  0: "Humidity Alert",
  2: "Shock Alert",
  3: "Tamper Alert",
}

function QRManager({ onBack }) {
  const { user } = useUser()
  const { contract, accounts, web3, address } = useWeb3()
  const { client } = useWeb3StorageClient()
  const [viewMode, setViewMode] = useState("list")
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
  const [QRactive, setQRactive] = useState(false)
  const [qrCID, setQrCID] = useState("")

  const [pendingTransfers, setPendingTransfers] = useState([])
  const [hoveredItem, setHoveredItem] = useState(null)
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: "" })
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

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
    }
  }, [contract, web3, accounts, address])

  // Function to close the custom alert
  const closeAlert = () => {
    setAlertInfo({ isOpen: false, message: "" })
  }
  const showAlert = (message) => {
    setAlertInfo({ isOpen: true, message })
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

  const generateQR = () => {
    const link = qrCID
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
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
      setQrCID(url)
      //   console.log("QR CID:", qrCID)

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
      setQRactive(true)
    } catch (error) {
      console.error("Failed to fetch shipment details:", error)
      showAlert("Failed to fetch shipment details: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderPersonalShipments = () => (
    <>
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <h3 style={{ ...style.textLarge }}>My Shipments</h3>
        {/* {loading && <div style={{ color: "gray" }}>Loading...</div>} */}
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
                // setQRactive(true)
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

  const renderButtons1 = () => (
    <div style={style.buttonColumn}>
      <button
        style={style.button}
        onClick={() => {
          setViewMode("personal")
          setQRactive(false)
        }}
      >
        My Shipments
      </button>

      <button style={style.button} onClick={onBack}>
        ← Back
      </button>
    </div>
  )

  const renderButtons2 = () => (
    <div style={style.buttonColumn}>
      <button
        style={style.button}
        onClick={() => {
          setViewMode("personal")
          setQRactive(false)
        }}
      >
        My Shipments
      </button>

      <button
        style={{ ...style.button, backgroundColor: "green" }}
        onClick={generateQR}
      >
        Generate QR Code
      </button>

      <button style={style.button} onClick={onBack}>
        ← Back
      </button>
    </div>
  )

  const renderView = () => {
    switch (viewMode) {
      case "personal":
        return (
          <>
            <div style={{ ...style.container, overflowY: "auto" }}>
              {loading ? <p>Loading...</p> : renderPersonalShipments()}
            </div>
          </>
        )

      case "list":
        return (
          <div style={{ ...style.container, overflowY: "auto" }}>
            {loading ? <p>Loading...</p> : renderPersonalShipments()}
          </div>
        )

      case "details":
        return (
          <>
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
                    onClick={() => {
                      setViewMode("list")
                      setQRactive(false)
                    }}
                  >
                    ← Back
                  </button>
                </div>
              )}
            </div>
          </>
        )
    }
  }

  return (
    <div style={style.container}>
      {QRactive ? renderButtons2() : renderButtons1()}

      {renderView()}

      {loading && <LoadingSpinner />}

      {showModal && (
        <>
          <div style={style.modalOverlay}>
            <div style={style.modalContent}>
              <button
                style={{ ...style.closeButton, color: "black" }} // Corrected style object
                onClick={closeModal} // Corrected onClick handler
              >
                X
              </button>

              <QRCode
                value={"http://localhost:3001/?cid=" + qrCID}
                size={512}
                // center it
                style={{ display: "block", margin: "0 auto" }}
              />
              <div style={style.textContainer}>
                <button
                  onClick={() =>
                    window.open("http://localhost:3001/?cid=" + qrCID, "_blank")
                  }
                  style={{
                    backgroundColor: "#4CAF50", // Green
                    border: "none",
                    color: "white",
                    padding: "15px 32px",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "inline-block",
                    fontSize: "16px",
                    margin: "4px 2px",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  Open Link
                </button>
              </div>
            </div>
          </div>
          <div style={style.blurredBackground}></div>
        </>
      )}
    </div>
  )
}

export default QRManager

const style = {
  modalOverlay: {
    position: "fixed",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 1050, // Ensure this is higher than other content
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 5,
    position: "relative",
    textAlign: "center",
    zIndex: 1051,
    maxWidth: "80%", // Limit the modal width
    overflow: "hidden", // Prevent content from expanding modal size
  },
  closeButton: {
    position: "absolute",
    top: 10, // Position adjusted for bigger close button
    right: 10, // Position adjusted for bigger close button
    border: "none",
    background: "none",
    fontSize: "2rem", // Larger font size for the close button
    cursor: "pointer",
    padding: "10px 15px", // Padding to make the close button larger
  },
  image: {
    maxWidth: "100%", // Ensure the image fits within the modal
    marginBottom: 30, // Increased space between the image and the QR code
  },
  textContainer: {
    wordWrap: "break-word", // Ensures long words do not cause layout issues
    overflowWrap: "break-word", // Ensures the text breaks properly
    maxWidth: "100%", // Limits text width to the modal width
    textAlign: "center", // Centers the text
    marginBottom: 20, // Spacing between QR code and text
  },
  blurredBackground: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backdropFilter: "blur(8px)", // Increased blur effect
    zIndex: 1040, // Lower than the modal but above other content
  },

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
