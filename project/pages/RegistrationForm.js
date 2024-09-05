import React, { useState, useEffect } from "react"
import Web3 from "web3"
import contract from "../build/contracts/Provenance.json"
import { Input, Select, Checkbox, Button } from "shadcn"

function RegistrationForm() {
  const [web3, setWeb3] = useState(null)
  const [myContract, setContract] = useState(null)
  const [formData, setFormData] = useState({
    entity: "",
    role: "",
    name: "",
    location: "",
    certified: false,
  })
  const [connectedAddress, setConnectedAddress] = useState("")

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum)
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" })
          setWeb3(web3Instance)
          const ABI = contract.abi
          const networkId = Object.keys(contract.networks)[0] // Assuming there's only one network
          const address = contract.networks[networkId].address
          const deployedContract = new web3Instance.eth.Contract(ABI, address)
          setContract(deployedContract)
          const accounts = await web3Instance.eth.getAccounts()
          setConnectedAddress(accounts[0])
        } catch (error) {
          console.error("Error requesting accounts:", error)
        }
      } else {
        console.error("MetaMask not detected")
      }
    }
    initWeb3()
  }, [])

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const { entity, role, name, location, certified } = formData
      const fromAddress = connectedAddress

      await myContract.methods
        .registerEntity(entity, role, name, location, certified)
        .send({ from: fromAddress })

      console.log("Entity registered successfully!")
      // Additional code for handling successful submission
    } catch (error) {
      console.error("Transaction error:", error)
      // Additional code for handling errors
    }
  }

  return (
    <div>
      <h1>Register Entity</h1>
      <form onSubmit={handleSubmit}>
        <Input
          type='text'
          name='entity'
          value={formData.entity}
          onChange={handleInputChange}
          placeholder='Entity Address'
        />
        <Select name='role' value={formData.role} onChange={handleInputChange}>
          <option value=''>Select Role</option>
          <option value='Role1'>Role1</option>
          <option value='Role2'>Role2</option>
        </Select>
        <Input
          type='text'
          name='name'
          value={formData.name}
          onChange={handleInputChange}
          placeholder='Name'
        />
        <Input
          type='text'
          name='location'
          value={formData.location}
          onChange={handleInputChange}
          placeholder='Location'
        />
        <Checkbox
          name='certified'
          checked={formData.certified}
          onChange={handleInputChange}
        />{" "}
        Certified
        <Button type='submit'>Register</Button>
      </form>
    </div>
  )
}

export default RegistrationForm
