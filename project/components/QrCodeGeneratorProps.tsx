// components/QrCodeGenerator.tsx
import React from 'react';
import QRCode from 'qrcode.react';

interface QrCodeGeneratorProps {
    url: string;
    params?: Record<string, any>; // Make params optional for default testing
}

const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({
    url,
    params = {
        productId: 123,
        productName: "Example Product",
        temperatures: [-1,0,-2,1,1,3,0,-2],
        cities :["Oradea","Sibiu"],
        
    }
}) => {
    // Function to convert parameters to a Base64-encoded string
    const getBase64Params = (params:any) => {
        const jsonString = JSON.stringify(params);
        const encodedString = Buffer.from(jsonString, 'utf-8').toString('base64');
        return encodedString;
      };

    // Complete URL with Base64-encoded parameters
    const fullUrl = `${url}?data=${getBase64Params(params)}`;

    return (
        <div style={{ backgroundColor: 'white', padding: '10px' }}> // Set white background here
            <QRCode value={fullUrl} size={256} level="H" />
            <p>Scan the QR Code</p>
        </div>
    );
};

export default QrCodeGenerator;
