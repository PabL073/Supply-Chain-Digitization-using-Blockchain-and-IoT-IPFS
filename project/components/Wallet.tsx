
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useListen } from '../hooks/useListen';
import { useMetamask } from '../hooks/useMetamask';
import { Loading } from './Loading';
import { Boxes } from './background-boxes'; 
import useWeb3 from "../hooks/useWeb3";

import {initialValues, useUser} from "../context/EntityData";
import { init } from 'next/dist/compiled/webpack/webpack';


export default function Wallet() {
  const {
    dispatch,
    state: { status, isMetamaskInstalled, wallet, balance },
  } = useMetamask();
  const listen = useListen();

  const showInstallMetamask = status !== 'pageNotLoaded' && !isMetamaskInstalled;
  const showConnectButton = status !== 'pageNotLoaded' && isMetamaskInstalled && !wallet;
  const isConnected = status !== 'pageNotLoaded' && wallet;
  const { entityDetails, setEntityDetails} = useWeb3();
  const {user, updateUser} = useUser();

  useEffect(() => { 
    if(entityDetails){
      updateUser(entityDetails);
    }
    else
    {
      updateUser(initialValues);
    }
  }, [entityDetails]);

  useEffect(() => {
    console.log("Wallet2: ",user)
  }
  , [user]);

  const handleConnect = async () => {

    console.log("Connect initiated");
    dispatch({ type: 'loading' });
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        });
        dispatch({ type: 'connect', wallet: accounts[0], balance });
    
        
        listen();
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } 
  };

  const handleDisconnect = async () => {

    dispatch({ type: 'disconnect' });
    //removeEntityDetails();
    //setEntityDetails(null);


    updateUser(initialValues);
  };


  return (
    <div className="relative w-full bg-slate-900 py-16 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Boxes /> {/* Animated Boxes background contained within the Wallet component */}
      </div>
      <div className="z-10 relative w-full max-w-4xl mx-auto text-center px-4">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Connect your wallet
        </h2>
        {wallet && balance && (
          <div className="mt-4 text-white">
            Address: <span>{wallet}</span><br />
            Balance: <span>{(parseInt(balance) / 1e18).toFixed(4)} ETH</span>
          </div>
        )}
        {showConnectButton && (
          <button
            onClick={handleConnect}
            className="mt-8 inline-flex items-center justify-center rounded-md border border-transparent bg-ganache px-5 py-3 text-base font-medium text-white"
          >
            {status === 'loading' ? <Loading /> : 'Connect Wallet'}
          </button>
        )}
        {showInstallMetamask && (
          <Link href="https://metamask.io/" target="_blank">
            <button className="mt-8 inline-flex items-center justify-center rounded-md border border-transparent bg-ganache px-5 py-3 text-base font-medium text-white">
              Install Metamask
            </button>
          </Link>
        )}
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="mt-8 inline-flex items-center justify-center rounded-md border border-transparent bg-ganache px-5 py-3 text-base font-medium text-white"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}


