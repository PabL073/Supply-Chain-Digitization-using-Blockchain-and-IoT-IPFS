import React, { useEffect, useState } from "react"

import CustomAlert from "./CustomAlert"
import useWeb3 from "../hooks/useWeb3"
import { useUser } from "../context/EntityData"

function BlockchainEventListener() {
  const { user, updateUser } = useUser()
  const { contract, accounts, web3 } = useWeb3()
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
  })

  useEffect(() => {
    if (contract && accounts.length) {
      const eventHandlers = []

      const eventSubscription = contract.events
        .ShipmentAdded({
          filter: { producer: [accounts[0]] },
          fromBlock: "latest",
        })
        .on("data", (event) => {
          console.log("Event received:", event)
          setNotification({
            isOpen: true,
            message: "Notification: " + event.returnValues.message,
          })
        })

      eventHandlers.push(eventSubscription)

      const eventSubscription2 = contract.events
        .ProductCreatedFromExisting({
          filter: { producer: [accounts[0]] },
          fromBlock: "latest",
        })
        .on("data", (event) => {
          console.log("Event received:", event)
          setNotification({
            isOpen: true,
            message: "Notification: " + event.returnValues.message,
          })
        })
        .on("error", (error) => {
          console.error("Error in event listener:", error)
        })

      eventHandlers.push(eventSubscription2)
    }

    return () => {
      eventHandlers.forEach((subscription) => subscription.unsubscribe())
    }
  }, [contract, accounts])

  const closeNotification = () => {
    setNotification({ isOpen: false, message: "" })
  }

  return (
    <div>
      <CustomAlert
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={closeNotification}
      />
    </div>
  )
}

export default BlockchainEventListener
