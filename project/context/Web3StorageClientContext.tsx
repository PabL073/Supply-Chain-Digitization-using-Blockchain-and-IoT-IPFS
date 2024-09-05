import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, create,  } from '@web3-storage/w3up-client'; // Adjust import as necessary
import { ClientFactoryOptions } from '@w3ui/react';

interface Web3StorageContextType {
    client: Client | null;
}

const Web3StorageContext = createContext<Web3StorageContextType>({
    client: null,
});

export const Web3StorageProvider: React.FC<{ children: ReactNode, clientOptions?: ClientFactoryOptions }> = ({ children, clientOptions }) => {
    const [client, setClient] = useState<Client | null>(null);

    useEffect(() => {
        const initializeClient = async () => {
            const options: ClientFactoryOptions = clientOptions || {}; // Use provided options or default to empty
            const client = await create(options);
            setClient(client);
        };

        initializeClient();
    }, [clientOptions]); // Depend on clientOptions to reinitialize if they change

    return (
        <Web3StorageContext.Provider value={{ client }}>
            {children}
        </Web3StorageContext.Provider>
    );
};

export const useWeb3StorageClient = () => useContext(Web3StorageContext);

