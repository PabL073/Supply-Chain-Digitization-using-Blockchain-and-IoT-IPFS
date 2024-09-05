import React from "react"

const CustomAlert = ({ message, isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div style={styles.alertContainer}>
      <div style={styles.alertBox}>
        <p style={styles.alertMessage}>{message}</p>
        <button onClick={onClose} style={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  )
}

const styles = {
  alertContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent background to blur rest of the page
    backdropFilter: "blur(8px)", // Adds blur effect to the content behind the alert
    zIndex: 1000, // High z-index to ensure it covers other elements
  },
  alertBox: {
    padding: "40px",
    backgroundColor: "#C8C8C8", // Light gray background for the alert box
    borderRadius: "12px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    width: "90%",
    maxWidth: "600px",
    textAlign: "center",
    color: "#333", // Ensuring text color is visible
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: "20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    cursor: "pointer",
  },
}

export default CustomAlert
