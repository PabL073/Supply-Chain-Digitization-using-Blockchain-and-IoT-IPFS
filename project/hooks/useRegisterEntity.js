import { useState, useEffect, useCallback } from "react"
import useWeb3 from "./useWeb3"
import CustomAlert from "../components/CustomAlert"

const useRegisterEntity = () => {
  const { web3, contract, accounts, address } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: "" })

  const showAlert = (message) => {
    setAlertInfo({ isOpen: true, message })
  }

  // Function to close the custom alert
  const closeAlert = () => {
    setAlertInfo({ isOpen: false, message: "" })
  }

  useEffect(() => {
    console.log("Web3:", web3)
  }, [accounts, address])

  const registerEntity = async (
    address,
    role,
    name,
    location,
    certified = 1,
    link
  ) => {
    if (!web3 || !contract || accounts.length === 0) {
      console.error("Web3 not initialized or no account connected")
      return false
    }

    console.log("Registering entity with the following details:")
    console.log("Address:", address)
    console.log("Role:", role)
    console.log("Name:", name)
    console.log("Location:", location)
    console.log("Certified:", certified)
    console.log("Link:", link)

    try {
      setLoading(true)

      const transactionObject = {
        from: "0x9bb7b3453887eaa48cad710e963cbd085eb7c312",
        to: contract.options.address,
        gas: 3000000,
        //gasPrice: 0, // Use legacy gasPrice
        data: contract.methods
          .registerEntity(address, role, name, location, certified, link)
          .encodeABI(),
      }

      const response = await web3.eth.sendTransaction(transactionObject)
      console.log("Transaction successful:", response)
      return true
    } catch (error) {
      console.error("Transaction failed:", error)
      if (error.code === 4001) {
        showAlert("Transaction rejected by the user")
      } else if (error.data && error.data.message) {
        showAlert("Transaction failed: " + error.data.message)
      } else {
        showAlert("Transaction failed: " + error.message)
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  return { registerEntity, loading }
}

export default useRegisterEntity
