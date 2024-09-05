import { useState, useEffect, useCallback } from "react"
import Web3 from "web3"
import ProvenanceContract from "../build/contracts/Provenance.json"
import { useMetamask } from "./useMetamask"

const useWeb3 = () => {
  const [web3, setWeb3] = useState(null)
  const [contract, setContract] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [address, setAddress] = useState([])
  const [entityDetails, setEntityDetails] = useState(null)

  const {
    dispatch,
    state: { wallet },
  } = useMetamask()

  const customRpcUrl = "http://127.0.0.1:7545" // blockchain url

  const contractAddress = "0xAadc064A54720A747E7A4A08e829170B940C683a" // contract address

  useEffect(() => {
    console.log("useWeb3Entity: ", entityDetails)
  }, [entityDetails])

  useEffect(() => {
    const loadWeb3AndContract = async () => {
      try {
        let web3Instance
        if (window.ethereum) {
          // Use MetaMask's provider
          web3Instance = new Web3(window.ethereum)
          await window.ethereum.enable()
        } else {
          // Use custom RPC URL
          web3Instance = new Web3(new Web3.providers.HttpProvider(customRpcUrl))
        }

        // Set the handleRevert property to true
        web3Instance.handleRevert = true
        setWeb3(web3Instance)

        // Manually specify the contract address
        const contractInstance = new web3Instance.eth.Contract(
          ProvenanceContract.abi,
          contractAddress
        )

        // Set the contract instance in state
        setContract(contractInstance)

        // Get the list of accounts

        const fetchedAccounts = await web3Instance.eth.getAccounts()
        setAccounts(fetchedAccounts)
        setAddress(wallet)
      } catch (error) {
        console.error("Error loading web3 or contract:", error)
        alert("Failed to load web3 or contract. Check console for details.")
      }
    }

    loadWeb3AndContract()
  }, [customRpcUrl, contractAddress])

  useEffect(() => {
    if (contract && accounts.length > 0) {
      fetchEntityDetails(accounts[0])
    }
  }, [contract, accounts])

  const handleAccountsChanged = useCallback(
    async (newAccounts) => {
      if (newAccounts.length > 0) {
        setAccounts(newAccounts)
        await fetchEntityDetails(newAccounts[0])
      } else {
        console.log("Please connect to MetaMask.")
      }
    },
    [contract]
  )

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [handleAccountsChanged])

  const fetchEntityDetails = useCallback(
    async (account) => {
      if (web3 && contract && account) {
        try {
          const details = await contract.methods
            .getEntityDetails(account)
            .call()

          if (details && details.name !== "") {
            setEntityDetails(details)
          } else {
            setEntityDetails(null)
            console.log("Entity details not found.")
          }
        } catch (error) {
          console.error("Error fetching entity details:", error)
          setEntityDetails(null)
        }
      }
    },
    [web3, contract]
  )

  return {
    web3,
    contract,
    accounts,
    address,
    entityDetails,
    setEntityDetails,
  }
}

export default useWeb3
