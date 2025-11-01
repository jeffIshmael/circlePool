/**
 * SDK Singleton - Ensures @hashgraph/sdk is imported only once
 * This module acts as the single source of truth for all @hashgraph/sdk imports
 * to prevent duplicate bundling issues
 */

let sdkModule: any = null;
let sdkPromise: Promise<any> | null = null;

/**
 * Get the SDK module - ensures single import across entire application
 * This prevents duplicate bundling by ensuring all imports use the same module instance
 */
export async function getSDKModule(): Promise<any> {
  if (sdkModule) {
    return sdkModule;
  }
  
  if (sdkPromise) {
    return sdkPromise;
  }
  
  // Import @hashgraph/sdk once and cache it
  // This is the ONLY place in the entire codebase that imports @hashgraph/sdk
  sdkPromise = import("@hashgraph/sdk").then((module) => {
    sdkModule = module;
    return module;
  });
  
  return sdkPromise;
}

/**
 * Re-export commonly used SDK classes for convenience
 * All code should use these functions instead of importing @hashgraph/sdk directly
 */
export async function getLedgerId() {
  const sdk = await getSDKModule();
  return sdk.LedgerId;
}

export async function getAccountId() {
  const sdk = await getSDKModule();
  return sdk.AccountId;
}

export async function getContractExecuteTransaction() {
  const sdk = await getSDKModule();
  return sdk.ContractExecuteTransaction;
}

export async function getContractFunctionParameters() {
  const sdk = await getSDKModule();
  return sdk.ContractFunctionParameters;
}

export async function getHbar() {
  const sdk = await getSDKModule();
  return sdk.Hbar;
}

export async function getContractId() {
  const sdk = await getSDKModule();
  return sdk.ContractId;
}

export async function getContractCallQuery() {
  const sdk = await getSDKModule();
  return sdk.ContractCallQuery;
}
