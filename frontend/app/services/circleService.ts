import {
    AccountId,
    ContractCreateTransaction,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    FileCreateTransaction,
    Hbar,
    Client,
    PrivateKey,
    ContractCallQuery,
    TokenId,
    FileId,
    Long,
    ContractCreateFlow,
} from "@hashgraph/sdk";
import * as fs from 'fs';
import * as path from 'path';
import { BigNumber } from 'bignumber.js';
import { CONTRACT_ID } from "../lib/constants";

export class CircleService {
    private client: Client;
    private contractId!: ContractId;
    private operatorId: AccountId;
    private operatorKey: PrivateKey;

    constructor(client: Client, operatorId: AccountId, operatorKey: PrivateKey) {
       
        this.client = client;
        this.operatorId = operatorId;
        this.operatorKey = operatorKey;
    }


    // Create Circle
    async createCircle(
        amount: number,
        duration: number,
        startDate: number,
        maxMembers: number,
        interestPercent: number,
        leftPercent: number
    ): Promise<string> {
        try {
            const transaction = new ContractExecuteTransaction()
                .setContractId(CONTRACT_ID)
                .setGas(1000000)
                .setFunction(
                    "registerCircle",
                    new ContractFunctionParameters()
                        .addUint256(amount)
                        .addUint256(duration)
                        .addUint256(startDate)
                        .addUint256(maxMembers)
                        .addUint256(interestPercent)
                        .addUint256(leftPercent)
                )

            const txResponse = await transaction.execute(this.client);
            console.log("TxResponse:", txResponse);
            const record = await txResponse.getRecord(this.client);
            console.log("Record:", record);
            
            if (!record.contractFunctionResult) {
                throw new Error("Failed to create Circle - no function result received");
            }

            console.log("Circle created:", record.contractFunctionResult);
            
            const circleId = record.contractFunctionResult.getInt64(0);
            return circleId.toString();
        } catch (error) {
            console.error("Error creating Circle:", error);
            throw error;
        }
    }

    // Mint a new NFT
    async mintNft(
        tokenAddress: string,
        metadata: Uint8Array[],
        availableDates: number[]
    ): Promise<BigNumber> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setFunction(
                    "mintNft",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addBytesArray(metadata)
                        .addUint256Array(availableDates)
                );

            const txResponse = await transaction.execute(this.client);
            const record = await txResponse.getRecord(this.client);
            
            if (!record.contractFunctionResult) {
                throw new Error("Failed to mint NFT - no function result received");
            }
            
            const serialNumber = record.contractFunctionResult.getInt64(0);
            return serialNumber;
        } catch (error) {
            console.error("Error minting NFT:", error);
            throw error;
        }
    }

    // Mint a new NFT directly to a specified address
    async mintTo(
        tokenAddress: string,
        receiver: string,
        metadata: Uint8Array[],
        availableDates: number[]
    ): Promise<BigNumber> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setFunction(
                    "mintTo",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addAddress(receiver)
                        .addBytesArray(metadata)
                        .addUint256Array(availableDates)
                );

            const txResponse = await transaction.execute(this.client);
            const record = await txResponse.getRecord(this.client);
            
            if (!record.contractFunctionResult) {
                throw new Error("Failed to mint NFT - no function result received");
            }
            
            const serialNumber = record.contractFunctionResult.getInt64(0);
            return serialNumber;
        } catch (error) {
            console.error("Error minting NFT to address:", error);
            throw error;
        }
    }

    // Transfer NFT
    async transferNft(
        tokenAddress: string,
        receiver: string,
        serialNumber: number
    ): Promise<void> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setFunction(
                    "transferNft",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addAddress(receiver)
                        .addInt64(serialNumber)
                );

            await transaction.execute(this.client);
        } catch (error) {
            console.error("Error transferring NFT:", error);
            throw error;
        }
    }

    // Check if a date is available
    async isDateAvailable(
        tokenAddress: string,
        serialNumber: number,
        date: number
    ): Promise<boolean> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const query = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    "isDateAvailable",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addInt64(serialNumber)
                        .addUint256(date)
                );

            const response = await query.execute(this.client);
            return response.getBool(0);
        } catch (error) {
            console.error("Error checking date availability:", error);
            throw error;
        }
    }

    // Update availability
    async updateAvailability(
        tokenAddress: string,
        serialNumber: number,
        date: number,
        isBooked: boolean
    ): Promise<void> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    "updateAvailability",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addInt64(serialNumber)
                        .addUint256(date)
                        .addBool(isBooked)
                );

            await transaction.execute(this.client);
        } catch (error) {
            console.error("Error updating availability:", error);
            throw error;
        }
    }

    // Get all dates for a property
    async getAllDates(
        tokenAddress: string,
        serialNumber: number
    ): Promise<number[]> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const query = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    "getAllDates",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addInt64(serialNumber)
                );

            const response = await query.execute(this.client);
            const dates: number[] = [];
            const length = response.getUint256(0).toNumber();
            
            for (let i = 0; i < length; i++) {
                dates.push(response.getUint256(i + 1).toNumber());
            }
            
            return dates;
        } catch (error) {
            console.error("Error getting all dates:", error);
            throw error;
        }
    }

    // Check if an address is the owner of an NFT
    async isOwner(
        tokenAddress: string,
        serialNumber: number
    ): Promise<boolean> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const query = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    "isOwner",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addInt64(serialNumber)
                );

            const response = await query.execute(this.client);
            return response.getBool(0);
        } catch (error) {
            console.error("Error checking ownership:", error);
            throw error;
        }
    }
}

// Example usage:
/*
const initializeNFTService = async () => {
    // Initialize your Hedera client
    const client = Client.forTestnet();
    
    // Configure your operator account
    const operatorId = AccountId.fromString("YOUR_OPERATOR_ID");
    const operatorKey = PrivateKey.fromString("YOUR_OPERATOR_PRIVATE_KEY");
    client.setOperator(operatorId, operatorKey);
    
    // Create NFT service instance
    const nftService = new NFTService(client, operatorId, operatorKey);
    
    // Deploy contract
    const contractId = await nftService.deployNFTContract();
    console.log("Contract deployed at:", contractId.toString());
    
    // Create NFT token
    const tokenAddress = await nftService.createNft(
        "HederaStays Properties",
        "HSTAY",
        "HederaStays Property Collection",
        1000, // maxSupply
        7776000 // autoRenewPeriod (90 days in seconds)
    );
    console.log("NFT token created at:", tokenAddress);
    
    // Mint an NFT
    const metadata = [Buffer.from("ipfs://your-property-metadata-uri")];
    const availableDates = [
        Math.floor(Date.now() / 1000), // Current timestamp
        Math.floor(Date.now() / 1000) + 86400, // Tomorrow
        Math.floor(Date.now() / 1000) + 172800, // Day after tomorrow
    ];
    
    const serialNumber = await nftService.mintNft(
        tokenAddress,
        metadata,
        availableDates
    );
    console.log("NFT minted with serial number:", serialNumber);
}
*/ 