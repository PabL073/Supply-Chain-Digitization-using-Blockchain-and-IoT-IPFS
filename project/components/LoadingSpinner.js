// Loading.js
import React from "react"

function LoadingSpinner() {
  const style = {
    container: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    },
    spinner: {
      border: "4px solid #f3f3f3",
      borderTop: "4px solid #3498db",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      animation: "spin 2s linear infinite",
    },
  }

  return (
    <div style={style.container}>
      <div style={style.spinner} />
    </div>
  )
}

export default LoadingSpinner
