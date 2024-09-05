// components/TicketDisplay.tsx
import React from 'react';
import QrCodeGeneratorProps from './QrCodeGeneratorProps';

interface TicketDetails {
    productId: number;
    productName: string;
    quantity?: number;
    details?: {
        size?: string;
        color?: string;
    };
}

interface TicketDisplayProps {
    ticketData: TicketDetails;
}

const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticketData }) => {
    const baseURL = "http://localhost:3001"; // URL of web page to access the ticket data


    const ticketStyle = {
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        padding: '20px',
        margin: '20px auto',
        maxWidth: '500px',
        background: 'linear-gradient(145deg, #1c1e2f, #2a2f45)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
    };

    const detailStyle = {
        fontSize: '16px',
        margin: '5px 0',
        fontWeight: '300',
    };

    return (
        <div style={ticketStyle}>
            <h2 style={{ fontWeight: 'bold', margin: '10px 0' }}>Ticket Information</h2>
            <p style={detailStyle}><strong>Product ID:</strong> {ticketData.productId}</p>
            <p style={detailStyle}><strong>Product Name:</strong> {ticketData.productName}</p>
            {/* Optionally display more details */}
            {ticketData.details && (
                <>
                    <p style={detailStyle}><strong>Size:</strong> {ticketData.details.size}</p>
                    <p style={detailStyle}><strong>Color:</strong> {ticketData.details.color}</p>
                </>
            )}


            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight white tint
                padding: '10px',
                borderRadius: '10px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
            }}>


            {/* QR Code Generator */}
            <QrCodeGeneratorProps url={baseURL} params={{
                productId: ticketData.productId,
                productName: ticketData.productName,
                cities: ["Oradea", "Sibiu"],
                temperatures: [-1, 0, -2, 1, 1, 3, 0, -2],
                logo: "logo.png",
              
                ...(ticketData.details ? { details: JSON.stringify(ticketData.details) } : {})
            }} />
        </div>
    </div>
    );
};

export default TicketDisplay;
