import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";

import dotenv from "dotenv";

dotenv.config();

const HEDERA_RPC_URL = process.env.HEDERA_RPC_URL as string;
const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY as string;

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    testnet: {
      type: "http",
      url: HEDERA_RPC_URL,
      accounts: [HEDERA_PRIVATE_KEY]
    }
  }
};

export default config;
