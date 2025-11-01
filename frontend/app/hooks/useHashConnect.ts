"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setLoading, setConnected, setDisconnected } from '../store/hashconnectSlice';

export function useHashConnect() {
  const dispatch = useDispatch();
  const hashconnectState = useSelector((state: RootState) => state.hashconnect);
  const { isConnected, accountId, isLoading } = hashconnectState;

  useEffect(() => {
    const setupHashConnect = async () => {
      try {
        if (typeof window === 'undefined') return;

        const { getHashConnectInstance, getInitPromise, getConnectedAccountIds } = await import('../services/hashconnect');

        const instance = await getHashConnectInstance();
        await getInitPromise();

        instance.pairingEvent.on(async () => {
          const accountIds = await getConnectedAccountIds();
          if (accountIds && accountIds.length > 0) {
            dispatch(setConnected({
              accountId: accountIds[0].toString()
            }));
          }
        });

        instance.disconnectionEvent.on(() => {
          dispatch(setDisconnected());
        });

        instance.connectionStatusChangeEvent.on(() => {});

        const accountIds = await getConnectedAccountIds();
        if (accountIds && accountIds.length > 0) {
          dispatch(setConnected({
            accountId: accountIds[0].toString()
          }));
        }
      } catch (error) {
        console.error('HashConnect setup failed:', error);
        dispatch(setLoading(false));
      }
    };

    setupHashConnect();
  }, [dispatch]);

  const connect = async () => {
    dispatch(setLoading(true));
    try {
      // Only run on client side
      if (typeof window === 'undefined') return;

      // Dynamically import HashConnect service
      const { getHashConnectInstance } = await import('../services/hashconnect');

      console.log("Attempting to connect to wallet...");
      const instance = await getHashConnectInstance();
      await instance.openPairingModal();
    } catch (error) {
      console.error('Connection failed:', error);
      dispatch(setLoading(false));
    }
  };

  const disconnect = async () => {
    try {
      if (typeof window === 'undefined') return;

      const { getHashConnectInstance } = await import('../services/hashconnect');

      const instance = await getHashConnectInstance();
      instance.disconnect();
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
