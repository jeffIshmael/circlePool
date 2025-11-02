"use client";

/**
 * WalletConnect Hook - Client-side wallet connection management
 * 
 * This hook uses WalletConnect directly with @hashgraph/sdk,
 * replacing HashConnect to eliminate duplicate bundling issues.
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setLoading, setConnected, setDisconnected } from '../store/hashconnectSlice';
import {
  initializeWalletConnect,
  connectWallet,
  disconnectWallet,
  getConnectedAccountIds,
  getDAppConnector,
} from '../services/walletConnect';

export function useHashConnect() {
  const dispatch = useDispatch();
  const hashconnectState = useSelector((state: RootState) => state.hashconnect);
  const { isConnected, accountId, isLoading } = hashconnectState;

  useEffect(() => {
    const setupWalletConnect = async () => {
      try {
        if (typeof window === 'undefined') return;

        await initializeWalletConnect();

        // Check for existing connection
        const connector = getDAppConnector();
        if (connector && connector.signers.length > 0) {
          const accountIds = await getConnectedAccountIds();
          if (accountIds && accountIds.length > 0) {
            dispatch(setConnected({
              accountId: accountIds[0].toString()
            }));
          }
        }

        // Listen for session events
        // Note: WalletConnect handles session persistence automatically
        // We check on mount and after connect/disconnect actions
      } catch (error) {
        console.error('WalletConnect setup failed:', error);
        dispatch(setLoading(false));
      }
    };

    setupWalletConnect();
  }, [dispatch]);

  const connect = async () => {
    dispatch(setLoading(true));
    try {
      if (typeof window === 'undefined') return;

      console.log("Attempting to connect to wallet...");
      await connectWallet();

      // Get connected account after successful connection
      const accountIds = await getConnectedAccountIds();
      if (accountIds && accountIds.length > 0) {
        dispatch(setConnected({
          accountId: accountIds[0].toString()
        }));
      }
    } catch (error) {
      console.error('Connection failed:', error);
      dispatch(setLoading(false));
    }
  };

  const disconnect = async () => {
    try {
      if (typeof window === 'undefined') return;

      await disconnectWallet();
      dispatch(setDisconnected());
    } catch (error) {
      console.error('Disconnect failed:', error);
      dispatch(setDisconnected());
    }
  };

  return {
    isConnected,
    accountId,
    isLoading,
    connect,
    disconnect,
  };
}
