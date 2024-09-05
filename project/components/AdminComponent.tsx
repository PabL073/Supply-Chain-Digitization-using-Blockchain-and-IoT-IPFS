import React, { useEffect, useState } from "react";
import useWeb from "../hooks/useWeb3";  
import { useUser } from "../context/EntityData"; 


const AdminComponent = () => {
    const { contract,accounts } = useWeb();
    const { user } = useUser();
    const [activeSection, setActiveSection] = useState("");
    const [entityAddress, setEntityAddress] = useState("");
    const [hoverState, setHoverState] = useState({
        certify: false,
        shipmentNumbers: false,
        registeredEntities: false,
        pendingTransfers: false
    });
    const [shipmentSerialNumbers, setShipmentSerialNumbers] = useState([]);
    const [registeredEntities, setRegisteredEntities] = useState([]);
    const [pendingTransfers, setPendingTransfers] = useState([]);
    const [entityDetails, setEntityDetails] = useState(null);
    const [shipmentDetails, setShipmentDetails] = useState({})
    const [shipmentSerialNo, setShipmentSerialNo] = useState(null);

    //create enum with roles
    enum Role { Supplier,
        Producer,
        Transporter,
        Warehouse,
        Market }


        const ALERT_CODES = {
            1: "Temperature Alert",
            2: "Humidity Alert",
            3: "Shock Alert",
          }
        
    // Define the style object
    const style = {
        normalText: {
            fontSize: "20px",
            color: "#333",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            textAlign: "center",
            margin: "10px",
        },
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
        hover: {
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
            overflowY: "auto",
            maxHeight: "300px",
            padding: "0",
            margin: "0",
        },
        listItem: {
            padding: "12px 18px",
            backgroundColor: "#333333",
            borderRadius: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            color: "white",
        }
    };

    const handleHover = (section:any) => {
        setHoverState({ ...hoverState, [section]: !hoverState[section] });
    };

    useEffect(() => {
        console.log("User: ", user[0]);
    }, [user]);

    const fetchEntityDetails = async (entityAddress:any) => {
        try {
            if (contract) {
                const details = await contract.methods.getEntityDetails(entityAddress).call();
                setEntityDetails(details);
            }
        } catch (error) {
            console.error("Error fetching entity details:", error);
        }

       
    };

    const fetchShipmentDetails = async (serial: any) => {
       
        console.log("Fetching shipment details for serial number:", serial);
    
        try {
            // Call to your blockchain contract to get the CID using the provided serial number
            const cid = await contract.methods.shipmentCIDs(serial).call();
            console.log("Fetched CID from blockchain:", cid);
    
            // Construct the URL to access the file on IPFS
            const url = `https://${cid}.ipfs.w3s.link`;
            const response = await fetch(url); // Fetch the JSON file from IPFS
    
            if (!response.ok) {
                throw new Error("Failed to fetch JSON from IPFS");
            }
    
            const jsonDetails = await response.json(); // Parse the JSON data
            console.log("Fetched shipment details:", jsonDetails);
    
            // Update the shipment details in state
            setShipmentDetails(jsonDetails);
            setShipmentSerialNo(serial);
            setActiveSection("details"); 
            // Asynchronous log to see updated state, consider moving or removing for production
            setTimeout(() => {
                if (shipmentDetails) {
                    console.log("Updated Temperature Logs:", shipmentDetails.temperatureLogs);
                    console.log("Updated Locations:", shipmentDetails.locations);
                }
            }, 1000);
    
        } catch (error) {
            console.error("Failed to fetch shipment details:", error);
            // Show alert or handle the error in the UI
          
        } finally {
         
        }
    };

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
    

    const certifyEntity = async (address:any) => {
        try {
            if (contract && entityAddress) {
                await contract.methods.certifyEntity(address, true).send({ from: user[0],
                    gas: 3000000,
                    //gasPrice: 10000000000
                 });
                setEntityAddress(''); // Clear input after operation
                alert("Entity certified successfully!");
            }
        } catch (error) {
            console.error("Error certifying entity:", error);
        }
    };

    const fetchShipmentSerialNumbers = async () => {
        try {
            if (contract) {
                const serialNumbers = await contract.methods.getAllShipmentSerialNumbers().call();
                setShipmentSerialNumbers(serialNumbers);
            }
        } catch (error) {
            console.error("Error fetching shipment serial numbers:", error);
        }
    };

    const fetchRegisteredEntities = async () => {
        try {
            if (contract) {
                const entities = await contract.methods.getAllRegisteredEntities().call();
                setRegisteredEntities(entities);
            }
        } catch (error) {
            console.error("Error fetching registered entities:", error);
        }

        console.log("Registered Entities:", registeredEntities);
    };

    const fetchPendingTransfers = async () => {
        try {
            if (contract) {
                //aray of pending transfers for each entity
                const transfers = await contract.methods.getPendingTransfers(accounts[1]).call();

                setPendingTransfers(transfers);
            }
        } catch (error) {
            console.error("Error fetching pending transfers:", error);
        }
    };

    return (
        <div style={{ ...style.container, flexDirection: "column" }}>
            <h2 style={style.textLarge}>Admin Panel</h2>
            {activeSection === "" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button
                        style={{ ...style.button, ...(hoverState.certify ? style.hover : {}) }}
                        onMouseEnter={() => handleHover('certify')}
                        onMouseLeave={() => handleHover('certify')}
                        onClick={() => setActiveSection("certify") }
                    >
                        Certify Entity
                    </button>
                    <button style={style.button}>
                        Decline Entity's Certification
                    </button>
                    <button
                        style={{ ...style.button, ...(hoverState.shipmentNumbers ? style.hover : {}) }}
                        onMouseEnter={() => handleHover('shipmentNumbers')}
                        onMouseLeave={() => handleHover('shipmentNumbers')}
                        onClick={() => {
                            setActiveSection("shipmentNumbers");
                            fetchShipmentSerialNumbers();
                            handleHover('shipmentNumbers');
                        }}
                    >
                        Show All Shipment's Serial Numbers
                    </button>
                    <button
                        style={{ ...style.button, ...(hoverState.registeredEntities ? style.hover : {}) }}
                        onMouseEnter={() => handleHover('registeredEntities')}
                        onMouseLeave={() => handleHover('registeredEntities')}
                        onClick={() => {
                            setActiveSection("registeredEntities");
                            fetchRegisteredEntities();
                            handleHover('registeredEntities');
                        }}
                    >
                        Show All Registered Entities
                    </button>
                    {/* <button
                        style={{ ...style.button, ...(hoverState.pendingTransfers ? style.hover : {}) }}
                        onMouseEnter={() => handleHover('pendingTransfers')}
                        onMouseLeave={() => handleHover('pendingTransfers')}
                        onClick={() => {
                            setActiveSection("pendingTransfers");
                            fetchPendingTransfers();
                            handleHover('pendingTransfers');
                        }}
                    >
                        Show Pending Transfers
                    </button> */}
                </div>
            )}

            {activeSection === "certify" && (
                <div style={{flexDirection: 'column', alignItems: 'center', width: '500px' }}>
                    <h2 style={style.normalText}>Enter the address of the entity you want to certify:</h2>
                    <input
                        style={style.input}
                        value={entityAddress}
                        onChange={(e) => setEntityAddress(e.target.value)}
                        placeholder="Entity's Address"
                    />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '20px',
                    }}>
                        <button 
                            style={style.button} 
                            onClick={() => certifyEntity(entityAddress)}  // Passing the entityAddress to the function
                        >
                            Certify
                        </button>
                        <button 
                            style={style.button} 
                            onClick={() => {
                                setActiveSection("");
                                
                                
                            }
                        }
                        onMouseEnter={() => handleHover('certify')}
                        onMouseLeave={() => handleHover('certify')}
                        >
                            ← Back to menu
                        </button>
                    </div>
                </div>
            )}


                    {activeSection === "shipmentNumbers" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <ul style={{ ...style.list, overflowY: "auto" }}>
                                {shipmentSerialNumbers.map((number, index) => (
                                    <li
                                        key={index}
                                        style={{ ...style.listItem, ...(hoverState[number] ? style.hover : {}) }}
                                     
                                        onClick={() => {
                                            console.log("Serial number clicked:", number);
                                            setActiveSection("details");
                                            fetchShipmentDetails(number);
                                        }}
                                    >
                                        {number}
                                    </li>
                                ))}
                            </ul>
                            <button
                                style={{ ...style.button, ...(hoverState.back ? style.hover : {}) }}
                                onMouseEnter={() => handleHover('back')}
                                onMouseLeave={() => handleHover('back')}
                                onClick={() => setActiveSection("")}
                            >
                                ← Back to menu
                            </button>
                        </div>
                    )}

            {activeSection === "details" && (
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
                         onClick={() => setActiveSection("")}
                       >
                         ← Back
                       </button>
                     </div>
                   )}
                 </div>
               )
                }

              

                {activeSection === "registeredEntities" && (
                    <>
                        <h3 style={{
                            fontSize: '28px',
                            color: '#333',
                            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                            textAlign: 'center',
                            margin: '10px'
                        }}>
                            Registered Entities
                        </h3>

                        <div>
                            {registeredEntities && registeredEntities.length > 0 ? (
                                <ul style={{
                                    ...style.list,
                                    overflowY: 'auto',
                                    maxHeight: '300px',
                                    marginBottom: '20px'
                                }}>
                                    {registeredEntities.map((entity, index) => (
                                        <li key={index} style={{ ...style.listItem, marginTop: 10 }} onClick={() => fetchEntityDetails(entity)}>
                                            {entity}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No registered entities found.</p>
                            )}

                            <button style={{
                                ...style.button,
                                display: 'block',
                                margin: '0 auto 20px'
                            }} onClick={() => setActiveSection("")}>
                                ← Back to menu
                            </button>

                            {entityDetails && (
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    border: '1px solid #e0e0e0',
                                    color: '#333',
                                    lineHeight: '1.6',
                                    fontSize: '16px',
                                    fontFamily: 'Arial, sans-serif',
                                }}>
                                    <p><strong>Address:</strong> {entityDetails.entityAddress}</p>
                                    <p><strong>Entity Name:</strong> {entityDetails.name}</p>
                                    <p><strong>Location:</strong> {entityDetails.location}</p>
                                    <p><strong>Role:</strong> {Role[entityDetails.role]}</p>
                                    <p><strong>Certified:</strong> {entityDetails.isCertified ? "Certified" : "Uncertified"}</p>
                                    <p><strong>Certificate link:</strong> 
                                        <a href={entityDetails.link} target="_blank" rel="noopener noreferrer" style={{
                                            color: '#007bff',
                                            textDecoration: 'none'
                                        }}>
                                            {entityDetails.link}
                                        </a>
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}




      
        </div>

        
    );
};

export default AdminComponent;


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