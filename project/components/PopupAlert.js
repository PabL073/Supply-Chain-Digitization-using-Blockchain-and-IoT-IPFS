// PopupAlert.js
import React from "react"

const PopupAlert = ({ message, onClose }) => {
  if (!message) return null

  return (
    <div style={styles.popupContainer}>
      <div style={styles.popupMessage}>
        {message}
        <button onClick={onClose} style={styles.closeButton}>
          X
        </button>
      </div>
    </div>
  )
}

const styles = {
  popupContainer: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1000,
    animation: "fadeIn 0.3s",
  },
  popupMessage: {
    background: "orange",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
  },
  closeButton: {
    marginLeft: "15px",
    background: "none",
    border: "none",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
}

export default PopupAlert
