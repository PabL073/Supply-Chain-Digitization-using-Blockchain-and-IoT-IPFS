




    "use client";
    import "../styles/globals.css";
    import type { AppProps } from "next/app";
    import { MetamaskProvider } from "../hooks/useMetamask";
    import { UserProvider } from "../context/EntityData";
    import LoggedComponent from "../components/LoggedComponent";
    import { TracingBeam } from "../components/tracing-beam";
    import { FileUrlProvider } from "../context/FileUrlContext";
    import { Web3StorageProvider } from "../context/Web3StorageClientContext";

    import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode; // This type can accept any valid React child (element, string, number, etc.)
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.log(error, errorInfo);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
    }
}

    
    

    const MyApp = ({ Component, pageProps }: AppProps) => {

        return (
            <UserProvider>
                
                <MetamaskProvider>
                <Web3StorageProvider>
                    <FileUrlProvider>
                    
                        <Component {...pageProps}  />
                        
                        <TracingBeam className="min-h-screen">
                            <>
                                <LoggedComponent />
                            </>
                        </TracingBeam>
                            
                    </FileUrlProvider>
                </Web3StorageProvider>

                           
                </MetamaskProvider>
            </UserProvider>
          
        );
    };  


    export default MyApp;



