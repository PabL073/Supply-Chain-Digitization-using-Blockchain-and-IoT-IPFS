import { useEffect, useState } from "react";
import { IconSquareRoundedX } from "@tabler/icons-react";
import { useUser } from "../context/EntityData";
import WelcomeComponent from "../components/welcomeComponent";

import { PinContainer } from "../components/3d_pin";
import { EvervaultCard } from "../components/evervault-card";
import { MultiStepLoader } from "../components/multi-step-loader";
import  ShipmentManager  from "../components/ShipmentManager";
import { SignupFormDemo } from "./SignupFormDemo";
import FileUploadForm from "./FileUploadForm";
import ProductManager from "./ProductManager";
import QRManager from "./QRManager";
import useWeb3 from "../hooks/useWeb3";
import AdminComponent from "./AdminComponent";
import PopupAlert from "./PopupAlert";
import TicketDisplay from "./TicketDisplay";


const LoggedComponent = () => {
    const { user } = useUser();
    const [showShipmentManager, setShowShipmentManager] = useState(false);
    const [showProductManager, setShowProductManager] = useState(false);
    const [showQRManager, setShowQRManager] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const {contract,accounts }  = useWeb3();
    const [alertMessage, setAlertMessage] = useState('');


    const handleBack = () => {
        setShowShipmentManager(false);
        setShowProductManager(false);
        setShowQRManager(false);
    }

    useEffect(() => {
        console.log("Loggggggg: ", user);
        // console.log("logg2: ",contract)
        
    }, [user, contract,accounts]);

    useEffect(() => {
        if (!contract || !user[0]) return;
    
        const setupEventListeners = async () => {
            try {
                console.log('Setting up event listeners...');
    

            
                // Listening for Product Added events
                contract.events.ProductAdded({
                    fromBlock: 'latest',
                    filter: { producer: [user[0]] }
                })
                .on('data', event => {
                    console.log('Product Added:', event);
                    setAlertMessage(`New Product Added: ${event.returnValues.serialNo}`);
                    setTimeout(() => setAlertMessage(''), 5000);
                })
                .on('error', console.error);
            } catch (error) {
                console.error('Error setting up event listeners:', error);
            }


            try {
                console.log('Setting up event listeners...');
                // Listening for Shipment Added events
                contract.events.ShipmentAdded({
                    fromBlock: 'latest',
                    filter: { sender: [user[0]] }
                })
                .on('data', event => {
                    console.log('Shipment Added:', event);
                    setAlertMessage(`New Shipment Added: ${event.returnValues.serialNo}`);
                    setTimeout(() => setAlertMessage(''), 5000);
                })
                .on('error', console.error);
            }
            catch (error) {
                console.error('Error setting up event listeners: for ', error);
            }


            try {
                contract.events.ShipmentTransferInitiated({
                    fromBlock: 'latest',
                    filter: { from: [user[0]] }
                })
                .on('data', event => {
                    console.log('Shipment Transfer Initiated:', event);
                    setAlertMessage(`Shipment Transfer Initiated: ${event.returnValues.serialNo}`);
                    setTimeout(() => setAlertMessage(''), 5000);
                })
            }
            catch (error) {
                console.error('Error setting up event listeners: for ', error);
            }

         


            try {
                contract.events.ShipmentTransferAccepted({
                    fromBlock: 'latest',
                    filter: { newOwner: [user[0]] }
                })
                .on('data', event => {
                    console.log('Shipment Transfer Accepted:', event);
                    setAlertMessage(`Shipment Transfer Accepted: ${event.returnValues.serialNo}`);
                    setTimeout(() => setAlertMessage(''), 5000);
                })

            } catch (error) {
                console.error('Error setting up event listeners: for ', error);

            }


            try 
            {
                contract.events.ShipmentTransferRejected({
                    fromBlock: 'latest',
                    filter: { rejector: [user[0]] }
                })
                .on('data', event => {
                    console.log('Shipment Transfer Rejected:', event);
                    setAlertMessage(`Shipment Transfer Rejected: ${event.returnValues.serialNo}`);
                    setTimeout(() => setAlertMessage(''), 5000);
                })
            } catch (error) {
                console.error('Error setting up event listeners: for ', error);
            }

            try {
                contract.events.ShipmentOwnershipTransferred({
            
                    fromBlock: 'latest',
                    filter: { from: user[0] },
    
                })
                .on('data', event => {
                    console.log('Shipment Transfer Transferred:', event);
                    setAlertMessage(`Shipment Transferred: ${event.returnValues.serialNo}`);
                    setTimeout(() => setAlertMessage(''), 5000);
                })
            } catch (error) {
                console.error('Error setting up event listeners: for ', error);
            }


            try {
                contract.events.ShipmentUpdated({
                    fromBlock: 'latest',
                    filter: { updatedBy: [user[0]] }
                })
                .on('data', event => {
                    console.log('Shipment Updated:', event);
                    setAlertMessage(`Shipment Updated: ${event.returnValues.serialNo}`);
                    setTimeout(() => setAlertMessage(''), 5000);
                })
            } catch (error) {
                console.error('Error setting up event listeners: for ', error);

                

            }






        }
    
    
        setupEventListeners();
    
        return () => {
            console.log('Cleaning up event listeners...');
            // Cleanup logic depends on how your web3 provider manages connections
            // Proper cleanup might involve managing WebSocket disconnections if applicable
        };
    }, [contract, user]); // Depend on both contract and user for re-subscription when these dependencies change
    
    useEffect(() => {
        const checkAdmin = async () => {
            if (contract && user && user[0]!= null ) {
                try {
                    console.log("UserLogged: ", user[0]);

                    const is_Admin = await contract.methods.isAdmin(user[0]).call();
                    setIsAdmin(is_Admin);
                } catch (error) {
                    console.error("Error checking admin status:", error);
                    // Handle error
                }
            }
        };
    
        checkAdmin();
        // console.log("??isAdmin: ", user[0]);  
    }, [contract, user]);
    


    const loadingStates = [
        { text: "Track." },
        { text: "Record." },
        { text: "Verify." },
        { text: "Report." }
    ];

 
    const ticketData = {
        productId: 123,
        productName: "Example Product",
        temperatures: [-1,0,-2,1,1,3,0,-2],
        cities :["Oradea", "Cluj-Napoca", "Sibiu"]
    }
    
    

    return (
        <>
    
            <PopupAlert message={alertMessage} onClose={() => setAlertMessage('')} />
            {isAdmin ? (
                <>
                    {/* empty space div here */}
                    <div className="mt-8 md:mt-12"></div>
                    <EvervaultCard text="Blockchain tracking DApp" />
                    <div className="mt-8 md:mt-12"></div>
                    <AdminComponent />

                    
                </>
            ) : (
            <>

            {user && user.name !== "" ? (
                <>
                     <WelcomeComponent />
                    {showShipmentManager ? (
                        <ShipmentManager onBack={handleBack} />
                    ) : showProductManager ? (
                        <ProductManager onBack={handleBack} />
                    ) 
                    : showQRManager ? (
                        <QRManager onBack={handleBack} />
                    )
                    : (
                        <>
                            <EvervaultCard text="Blockchain tracking DApp" />
                            <div className="mt-8 md:mt-12"></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl px-4">
                                <div onClick={() => setShowShipmentManager(true)}>
                                <PinContainer title="Create Shipment" href="#">
                                    <div className="flex flex-col p-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem] ">
                                        <h3 className="max-w-xs !pb-2 !m-0 font-bold text-base text-slate-100">
                                            Shipment Manager
                                        </h3>
                                        <div className="text-base !m-0 !p-0 font-normal">
                                            <span className="text-slate-500 "></span>
                                        </div>
                                        <div className="flex flex-1 w-full rounded-lg mt-4 bg-gradient-to-br from-blue-500 via-gray-500 to-yellow-500" />
                                    </div>
                                </PinContainer>
                            </div>
                            
                            <div onClick={() => setShowQRManager(true)}>
                            <PinContainer
                                title="Track Shipments"
                                href="https://example.com/track"
                            >
                                <div className="flex flex-col p-4 tracking-tight text-slate-100 w-[20rem] h-[20rem]">
                                    <h3 className="max-w-xs !pb-2 !m-0 font-bold text-base text-slate-100">
                                        Report Generator
                                    </h3>
                                    <div className="flex flex-1 w-full rounded-lg mt-4 bg-gradient-to-br from-yellow-500 via-gray-500 to-black-500" />
                                </div>
                            </PinContainer>
                            </div>

                            
                            <div onClick={() => setShowProductManager(true)}>
                            <PinContainer
                                title="Add Products"
                                href="https://example.com/inventory"
                            >
                                <div className="flex flex-col p-4 tracking-tight text-slate-100 w-[20rem] h-[20rem]">
                                    <h3 className="max-w-xs !pb-2 !m-0 font-bold text-base text-slate-100">
                                        Product Manager
                                    </h3>
                                    <div className="flex flex-1 w-full rounded-lg mt-4 bg-gradient-to-br from-gray-500 via-gray-500 to-orange-500" />
                                </div>
                            </PinContainer>
                            </div>
                            </div>
                            
                        </>
                    )}
                </>
            ) : (
                <>
                
                    <SignupFormDemo />
                    <FileUploadForm />
                </>
            )}

            <div className="mt-20 md:mt-24"></div>
            <div className="flex justify-center items-center h-full"> {/* Ensures full-height centering */}
                <button 
                    onClick={() => setShowLoader(true)} 
                    className="mt-4 bg-gray-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    DApp's "long story short"
                </button>
            </div>
            </>
            )}

            {showLoader && (
                <>
                    <MultiStepLoader loadingStates={loadingStates} loading={showLoader} />
                    <button onClick={() => setShowLoader(false)} className="fixed top-4 right-4 text-black dark:text-white z-[120]">
                        <IconSquareRoundedX className="h-10 w-10" />
                    </button>
                </>
            )}
        </>
    );
};

export default LoggedComponent;
