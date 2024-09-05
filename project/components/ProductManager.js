import React, { useState, useEffect } from "react"
import useWeb3 from "../hooks/useWeb3"
import { useUser } from "../context/EntityData"
import LoadingSpinner from "./LoadingSpinner"
import CustomAlert from "./CustomAlert"
import { useWeb3StorageClient } from "../context/Web3StorageClientContext"

function ProductManager({ onBack }) {
  const { user, updateUser } = useUser()
  const { contract, accounts, web3 } = useWeb3()
  const [serialNo, setSerialNo] = useState("")
  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")

  const [additionalDetails, setAdditionalDetails] = useState("")
  const [parentSerialNos, setParentSerialNos] = useState("")
  const [owner, setOwner] = useState("")
  const [productList, setProductList] = useState([])
  const [productDetails, setProductDetails] = useState(null)
  const [viewMode, setViewMode] = useState("list")
  const [hoveredItem, setHoveredItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedSerial, setSelectedSerial] = useState(null)
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: "" })
  const { client } = useWeb3StorageClient()

  useEffect(() => {
    fetchProducts()
    if (contract) {
      console.log("ProductManager.js: contract", contract.config.handleRevert)
    }
  }, [contract, web3])

  const showAlert = (message) => {
    setAlertInfo({ isOpen: true, message })
  }

  // Function to close the custom alert
  const closeAlert = () => {
    setAlertInfo({ isOpen: false, message: "" })
  }

  const fetchProducts = async () => {
    setLoading(true)

    if (contract) {
      try {
        const serialNumbers = await contract.methods
          .getAllProductSerialNumbers()
          .call()
        setProductList(serialNumbers)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching products:", error)
        setLoading(false)
      }
    }
  }

  const handleViewDetails = async (serial) => {
    setLoading(true)
    try {
      const cid = await contract.methods.getProductCID(serial).call()
      const url = `https://${cid}.ipfs.w3s.link` // Construct the URL to access the file
      console.log("URL:", url)

      const response = await fetch(url) // Fetch the JSON file from IPFS
      if (!response.ok) throw new Error("Failed to fetch JSON from IPFS")
      const jsonDetails = await response.json() // Parse the JSON data

      console.log("Product details:", jsonDetails)

      setProductDetails(jsonDetails) // Update your state or context with the fetched details
      setViewMode("details")
    } catch (error) {
      console.error("Failed to fetch product details:", error)
      alert("Failed to fetch product details: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    if (accounts.length === 0) {
      alert("No connected accounts")
      return
    }

    setLoading(true)

    let date = new Date().toISOString()
    const newProduct = {
      serialNo: serialNo,
      timestamp: date,
    }

    const jsonData = JSON.stringify({
      serialNo: newProduct,
      owner: accounts[0],
      productName: productName,
      description: description,
      additionalDetails: additionalDetails,
    })

    const blob = new Blob([jsonData], { type: "application/json" })
    const file = new File([blob], `${serialNo}.json`) // Using serial number as the file name

    try {
      if (file && client) {
        // Correct usage of uploadFile
        const fileCid = await client.uploadFile(file) // Pass the File directly

        const CID = fileCid.toString()
        console.log("Uploaded to IPFS with CID:", CID)
        //make fileCID a string

        const transactionObject = {
          from: accounts[0],
          to: contract.options.address,
          gas: 3000000,
          //gasPrice: 0,
          data: contract.methods.addProduct(serialNo, CID).encodeABI(),
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

  const handleCreateProductFromExisting = async () => {
    if (accounts.length === 0) {
      alert("No connected accounts")
      return
    }

    setLoading(true)

    console.log(
      "Parent serial numbers:",
      parentSerialNos.split(",").map((s) => s.trim())
    )

    // let new_ParenSerialNos = {
    //   serialNo: "",
    //   CID: "",
    // }
    // Create JSON object for each parent serial number, get the CIDs

    const new_ParenSerialNos = await Promise.all(
      parentSerialNos.split(",").map(async (serial) => {
        const trimmedSerial = serial.trim() // Trim spaces around serial numbers
        const cid = await contract.methods.getProductCID(trimmedSerial).call()

        return { serialNo: trimmedSerial, CID: cid } // Return an object containing both the serial number and its CID, trimmed
      })
    )

    // Log the array of objects with serial numbers and their corresponding CIDs
    console.log("Parent CIDs with Serial Numbers:", new_ParenSerialNos)

    const date = new Date().toISOString()

    const newProduct = {
      serialNo: serialNo,
      timestamp: date,
    }

    const jsonData = JSON.stringify({
      serialNo: newProduct,
      owner: accounts[0],
      productName: productName,
      description: description,
      additionalDetails: additionalDetails,
      parentSerialNos: [new_ParenSerialNos],
    })

    const blob = new Blob([jsonData], { type: "application/json" })
    const file = new File([blob], `${serialNo}.json`)

    try {
      if (file && client) {
        const fileCid = await client.uploadFile(file) // Pass the File directly
        const CID = fileCid.toString()
        console.log("Uploaded to IPFS with CID:", CID)

        const transactionObject = {
          from: accounts[0],
          to: contract.options.address,
          gas: 3000000,
          //gasPrice: 0,
          data: contract.methods
            .createProductFromExisting(
              serialNo,
              parentSerialNos.split(",").map((s) => s.trim()),
              CID
            )
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

  function formatDate(dateString) {
    const date = new Date(dateString)

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      timeZoneName: "short",
    }

    return date.toLocaleString("en-US", options)
  }

  const showAddProductForm = () => {
    setViewMode("add")
  }

  const showAddProductExistingForm = () => {
    setViewMode("createFromExisting")
  }

  const showAllProducts = () => {
    setViewMode("list")
    fetchProducts()
  }

  const style = {
    container: {
      padding: "24px",
      maxWidth: "640px",
      margin: "auto",
      backgroundColor: "#f4f4f8",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
    },
    button: {
      marginTop: "16px",
      backgroundColor: "#007bff",
      color: "white",
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      transition: "transform 0.3s ease-in-out, background-color 0.3s ease",
    },
    buttonHover: {
      transform: "scale(1.05)",
      backgroundColor: "#0056b3",
    },
    input: {
      marginTop: "8px",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #007bff",
      width: "calc(100% - 24px)",
      fontSize: "16px",
      transition: "border-color 0.3s ease, box-shadow 0.3s ease",
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
      <CustomAlert
        message={alertInfo.message}
        isOpen={alertInfo.isOpen}
        onClose={closeAlert}
      />
      <div style={style.textCenter}>
        <div style={style.textLarge}>Product Manager</div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {viewMode === "add" && (
              <>
                <p style={{ color: "#666" }}>
                  Enter product details below and click "Add Product".
                </p>
                <input
                  style={style.input}
                  placeholder='Serial Number'
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                />
                <input
                  style={style.input}
                  placeholder='Product Name'
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
                <textarea
                  style={style.input}
                  placeholder='Description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <textarea
                  style={style.input}
                  placeholder='Additional Details'
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                />
                <button
                  style={{
                    marginRight: "10px",
                    ...style.button,
                    ...(hoveredItem === "add" ? style.buttonHover : {}),
                  }}
                  onClick={handleAddProduct}
                  onMouseEnter={() => setHoveredItem("add")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Add Product
                </button>

                <button
                  style={{
                    //add space between buttons
                    marginLeft: "10px",
                    ...style.button,
                    ...(hoveredItem === "backToList" ? style.buttonHover : {}),
                  }}
                  onClick={showAllProducts}
                  onMouseEnter={() => setHoveredItem("backToList")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  ← Back to List
                </button>
              </>
            )}

            {viewMode === "createFromExisting" && (
              <>
                <p style={{ color: "#666" }}>
                  Enter product details below and click "Create Product".
                </p>
                <input
                  style={style.input}
                  placeholder='Serial Number'
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                />
                <input
                  style={style.input}
                  placeholder='Product Name'
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
                <textarea
                  style={style.input}
                  placeholder='Description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <textarea
                  style={style.input}
                  placeholder='Additional Details'
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                />
                <input
                  style={style.input}
                  placeholder='Base products serial numbers'
                  value={parentSerialNos}
                  onChange={(e) => setParentSerialNos(e.target.value)}
                />
                <button
                  style={{
                    marginRight: "10px",
                    ...style.button,
                    ...(hoveredItem === "createFromExisting"
                      ? style.buttonHover
                      : {}),
                  }}
                  onClick={handleCreateProductFromExisting}
                  onMouseEnter={() => setHoveredItem("createFromExisting")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Create Product
                </button>

                <button
                  style={{
                    marginLeft: "10px",
                    ...style.button,
                    ...(hoveredItem === "backToList" ? style.buttonHover : {}),
                  }}
                  onClick={showAllProducts}
                  onMouseEnter={() => setHoveredItem("backToList")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  ← Back to List
                </button>
              </>
            )}

            {viewMode === "list" && (
              <>
                <p style={{ color: "#666", marginTop: "10px" }}></p>
                <div>
                  <button
                    onClick={showAddProductForm}
                    style={{
                      ...style.button,
                      ...(hoveredItem === "add" ? style.buttonHover : {}),
                    }}
                    onMouseEnter={() => setHoveredItem("add")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    Add New Product
                  </button>
                </div>
                <div style={{ marginTop: "10px" }}>
                  <button
                    style={{
                      ...style.button,
                      ...(hoveredItem === "createFromExisting"
                        ? style.buttonHover
                        : {}),
                    }}
                    onClick={showAddProductExistingForm}
                    onMouseEnter={() => setHoveredItem("createFromExisting")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    Create Product From Existing
                  </button>
                </div>

                {productList.length > 0 ? (
                  <ul
                    style={{
                      ...style.list,
                      marginTop: "10px",
                    }}
                  >
                    {productList.map((serial) => (
                      <>
                        <li
                          key={serial}
                          onClick={() => {
                            handleViewDetails(serial)
                            setSelectedSerial(serial)
                          }}
                          style={{
                            ...style.listItem,
                            ...(hoveredItem === serial
                              ? style.listItemHover
                              : {}),
                          }}
                          onMouseEnter={() => setHoveredItem(serial)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          {serial}
                        </li>
                      </>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#666" }}>No products found</p>
                )}
              </>
            )}

            {viewMode === "details" && productDetails && (
              <>
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#f8f8f8",
                    borderRadius: "10px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <p
                    style={{
                      color: "#666",
                      fontSize: "18px",
                      fontWeight: "bold",
                      borderBottom: "1px solid #ddd",
                      paddingBottom: "10px",
                    }}
                  >
                    <p>
                      Serial Number : {productDetails.serialNo.serialNo}
                      <br />
                      Created On:{" "}
                      {formatDate(productDetails.serialNo.timestamp)}
                    </p>
                  </p>
                  <div
                    style={{
                      textAlign: "left",
                      color: "#333",
                      paddingTop: "10px",
                    }}
                  >
                    <p style={{ marginBottom: "5px" }}>
                      <strong>Product Name: </strong>{" "}
                      {productDetails.productName}
                    </p>
                    <p style={{ marginBottom: "5px" }}>
                      <strong>Product Owner: </strong> {productDetails.owner}
                    </p>

                    <p style={{ marginBottom: "5px" }}>
                      <strong>Description: </strong>{" "}
                      {productDetails.description}
                    </p>
                    {/* if productDetails.parentSerialNumbers print them */}
                    {productDetails.parentSerialNos &&
                      productDetails.parentSerialNos.length > 0 && (
                        <div style={{ marginBottom: "5px" }}>
                          <p style={{ marginBottom: "5px" }}>
                            {" "}
                            <strong>Origin Products: </strong>
                          </p>
                          {productDetails.parentSerialNos.map(
                            (innerArray, outerIndex) => (
                              <div
                                key={outerIndex}
                                style={{ marginBottom: "10px" }}
                              >
                                {innerArray.map((item, index) => (
                                  <p key={index}>
                                    Serial Number: {item.serialNo}, details:{" "}
                                    <a
                                      href={
                                        "https://" + item.CID + ".ipfs.w3s.link"
                                      }
                                      target='_blank'
                                      rel='noopener noreferrer'
                                    >
                                      {"https://" + item.CID + ".ipfs.w3s.link"}
                                    </a>
                                  </p>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      )}

                    <p style={{ marginBottom: "5px" }}>
                      <strong>Additional Details: </strong>
                      {productDetails.additionalDetails}
                    </p>
                  </div>
                </div>

                <button
                  style={{
                    ...style.button,
                    ...(hoveredItem === "backToList" ? style.buttonHover : {}),
                  }}
                  onClick={showAllProducts}
                  onMouseEnter={() => setHoveredItem("backToList")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  ← Back to List
                </button>
              </>
            )}
          </>
        )}
      </div>
      <button
        style={{
          ...style.button,
          ...(hoveredItem === "back" ? style.buttonHover : {}),
        }}
        onClick={onBack}
        onMouseEnter={() => setHoveredItem("back")}
        onMouseLeave={() => setHoveredItem(null)}
      >
        Back
      </button>
    </div>
  )
}

export default ProductManager
