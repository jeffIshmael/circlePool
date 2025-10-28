"use client";

import { ContractExecuteTransaction, ContractFunctionParameters, Hbar } from "@hashgraph/sdk";
// HashConnect handled through services/hashconnect.ts

const CONTRACT_ID = process.env.NEXT_PUBLIC_CIRCLEPOOL_CONTRACT_ID || "0x341D33440f85B5634714740DfafF285323C4657C"; // evm alias ok

export async function registerCircle(
  accountId: string,
  params: { amount: bigint; durationDays: number; startDate: number; maxMembers: number; interestPercent: number; leftPercent: number }
) {
  const { getHashConnectInstance, getInitPromise } = await import('../services/hashconnect');
  await getInitPromise();
  const hc = getHashConnectInstance();

  const f = new ContractFunctionParameters()
    .addUint256(Number(params.amount))
    .addUint256(params.durationDays)
    .addUint256(params.startDate)
    .addUint256(params.maxMembers)
    .addUint256(params.interestPercent)
    .addUint256(params.leftPercent);

  const tx = new ContractExecuteTransaction()
    .setContractId(CONTRACT_ID)
    .setGas(500000)
    .setFunction("registerCircle", f)
    .setMaxTransactionFee(new Hbar(2));

  const frozen = await (tx as any).freezeWithSigner(hc); // HashConnect shim supports this
  const res = await (frozen as any).executeWithSigner(hc);
  return res;
}

export async function depositCash(accountId: string, circleId: number, hbarTinybars: bigint) {
  const { getHashConnectInstance, getInitPromise } = await import('../services/hashconnect');
  await getInitPromise();
  const hc = getHashConnectInstance();

  const f = new ContractFunctionParameters().addUint256(circleId);

  const tx = new ContractExecuteTransaction()
    .setContractId(CONTRACT_ID)
    .setGas(300000)
    .setFunction("depositCash", f)
    .setPayableAmount(Hbar.fromTinybars(Number(hbarTinybars)))
    .setMaxTransactionFee(new Hbar(1));

  const frozen = await (tx as any).freezeWithSigner(hc);
  const res = await (frozen as any).executeWithSigner(hc);
  return res;
}


