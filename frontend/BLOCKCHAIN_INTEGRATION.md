# CirclePool Blockchain Integration

## ✅ Complete Integration Setup

### Architecture Overview

CirclePool uses a **two-tier architecture** for blockchain interactions:

1. **Client-Side (User Transactions)**: Users connect wallets via WalletConnect and sign their own transactions
2. **Server-Side (AI Agent Operations)**: Automated operations executed by the server using operator credentials

### What Was Added:

1. **Dependencies Installed**
   ```bash
   npm install @hashgraph/hedera-wallet-connect @hashgraph/sdk @reduxjs/toolkit react-redux
   ```

2. **Redux Store** (`app/store/`)
   - `hashconnectSlice.ts` - Wallet state management
   - `index.ts` - Store configuration

3. **WalletConnect Service** (`app/services/walletConnect.ts`)
   - Uses `@hashgraph/hedera-wallet-connect` (Official Hedera wrapper)
   - DAppConnector singleton instance
   - Initialize and manage wallet connections
   - Execute contract functions with user's signer
   - Get connected account IDs

4. **AI Agent Service** (`app/services/aiAgentService.ts`)
   - Server-side service for AI agent operations
   - Uses server credentials (`HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY`)
   - Functions: `setPayoutOrder()`, `processLoan()`, `checkPayDate()`, `setAiAgent()`
   - Requires operator account to be set as `aiAgent` on contract

5. **Hedera Client** (`app/lib/hederaClient.ts`)
   - Server-side Hedera client utility
   - Creates client with operator credentials
   - Used by AI agent service and API routes

6. **Custom Hooks**
   - `app/hooks/useHashConnect.ts` - Wallet connection hook (uses WalletConnect)
   - `app/hooks/useCircle.ts` - Circle contract interactions (createCircle, depositCash)

7. **Circle Service** (`app/services/circleService.ts`)
   - Client-facing API wrappers for read operations
   - Functions: `getTotalCircles()`, `getHbarBalance()`, `getCircleById()`, `getMembersOnchainWithBalances()`

8. **UI Components**
   - `app/components/HashConnectButton.tsx` - Connect/Disconnect button
   - Auto-registers user with EVM address on connection

9. **Redux Provider** (`app/providers.tsx`)
   - Wraps entire app with Redux store
   - Integrated into `app/layout.tsx`

## How It Works:

### 1. Wallet Connection Flow (Client-Side)
```
User clicks "Connect Wallet" 
  → WalletConnect opens pairing modal
  → User selects wallet (HashPack, Blade, etc.)
  → DAppConnector establishes session
  → Redux state updates with account ID
  → User auto-registered with EVM address
  → UI shows "Disconnect [accountId]" button
```

### 2. Redux State Management
```typescript
{
  hashconnect: {
    isConnected: boolean,
    accountId: string | null,
    isLoading: boolean
  }
}
```

### 3. User Transaction Flow (Client-Side)
```
User clicks "Register Circle" or "Deposit"
  → useHashConnect hook gets accountId from Redux
  → useCircle hook calls executeContractFunction()
  → walletConnect service builds ContractExecuteTransaction
  → freezeWithSigner() prepares transaction with user's signer
  → executeWithSigner() sends for wallet approval
  → Wallet pops up for signature
  → Transaction executes on Hedera
  → Success/failure feedback to user
```

### 4. AI Agent Operations Flow (Server-Side)
```
Cron job or API route triggered
  → aiAgentService function called (e.g., setPayoutOrder)
  → getHederaClient() creates client with operator credentials
  → ContractExecuteTransaction built
  → Executed with operator account (no user signature needed)
  → Transaction receipt returned
  → Database updated if needed
```

### 5. Read Operations Flow
```
Client component needs data
  → circleService function called (e.g., getCircleById)
  → API route called (/api/circle/[id])
  → Server uses getHederaClient() for read queries
  → ContractCallQuery executed
  → Data parsed and returned to client
```

## Usage Examples:

### Client-Side (User Transactions)

```typescript
// In any component:
import { useHashConnect } from "@/app/hooks/useHashConnect";
import { useCircle } from "@/app/hooks/useCircle";

// Connect wallet
const { isConnected, accountId, connect, disconnect } = useHashConnect();
const { createCircle, depositCash, loading, error } = useCircle();

// Connect wallet
await connect();

// Create a circle
await createCircle({
  amount: BigInt(10_000_000_000), // 100 HBAR in tinybars
  durationDays: 30,
  startDate: Math.floor(Date.now() / 1000),
  maxMembers: 10,
  interestPercent: 5,
  leftPercent: 10
});

// Deposit to circle
await depositCash({
  circleId: 1,
  amount: BigInt(10_000_000_000) // 100 HBAR
});
```

### Server-Side (AI Agent Operations)

```typescript
// In API routes or server functions:
import { setPayoutOrder, processLoan, checkPayDate } from "@/app/services/aiAgentService";

// Set payout order (requires AI agent role)
await setPayoutOrder(circleId, ["0x...", "0x...", "0x..."]);

// Process a loan
await processLoan("0x...", circleId, BigInt(5_000_000_000));

// Check pay dates for multiple circles
const results = await checkPayDate([1, 2, 3]);
```

### Read Operations

```typescript
// Client-side read operations:
import { getCircleById, getMembersOnchainWithBalances } from "@/app/services/circleService";

// Get circle data
const circle = await getCircleById(1);

// Get members with balances
const members = await getMembersOnchainWithBalances(1);
```

## Key Features:

✅ **Two-Tier Architecture** - Client-side user transactions + Server-side AI agent operations
✅ **WalletConnect Integration** - Official Hedera WalletConnect wrapper
✅ **Persistent State** - Connection survives page reloads
✅ **Auto-Registration** - Users automatically registered with EVM address on connection
✅ **Redux Integration** - Centralized wallet state management
✅ **Type Safety** - Full TypeScript support
✅ **Error Handling** - Graceful failures with helpful error messages
✅ **Address Conversion** - Automatic Hedera Account ID ↔ EVM Address conversion
✅ **ABI Encoding** - Proper handling of dynamic arrays and complex return types

## Testing:

1. Start the dev server: `npm run dev`
2. Open browser and click "Connect Wallet"
3. Select HashPack or Blade wallet via WalletConnect
4. Approve connection
5. Should see account ID in button
6. User is automatically registered with EVM address
7. Click "Create Circle" or "Deposit" to test contract interaction

## Environment Variables:

Create `.env.local`:
```bash
# Contract ID (Hedera format: 0.0.x)
CONTRACT_ID=0.0.7156202

# Server-side operator credentials (for AI agent operations)
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...

# Network (testnet or mainnet)
HEDERA_NETWORK=testnet

# API Key for API routes (optional)
NEXT_PUBLIC_API_KEY=your-api-key
```

## Important Notes:

### AI Agent Setup
- The server's operator account (`HEDERA_OPERATOR_ID`) must be set as the `aiAgent` on the contract
- Use `setAiAgent()` function to update the contract's `aiAgent` address
- Only the contract owner can set the `aiAgent`

### Address Formats
- **Hedera Account ID**: `0.0.xxxxx` format
- **EVM Address**: `0x...` format (42 characters)
- The system automatically converts between formats as needed
- Database stores both formats for compatibility

### Contract Functions

**User Functions** (Client-Side, requires wallet signature):
- `registerCircle()` - Create a new circle
- `depositCash()` - Deposit HBAR to a circle
- `addMember()` - Add member to circle
- `deleteMember()` - Remove member from circle
- `repayLoan()` - Repay a loan
- `deleteCircle()` - Delete a circle

**AI Agent Functions** (Server-Side, requires AI agent role):
- `setPayoutOrder()` - Set the payout order for a circle
- `processLoan()` - Process a loan for a member
- `checkPayDate()` - Check and process pay dates for multiple circles
- `setAiAgent()` - Update the AI agent address (owner only)

**Read Functions** (Both client and server):
- `getCircle()` - Get circle details
- `getBalance()` - Get member balance and loan
- `getEachMemberBalance()` - Get all members with balances
- `getTotalCircles()` - Get total number of circles

## File Structure:

```
frontend/
├── app/
│   ├── services/
│   │   ├── walletConnect.ts      # Client-side wallet connection & transactions
│   │   ├── aiAgentService.ts      # Server-side AI agent operations
│   │   └── circleService.ts       # Client-facing API wrappers
│   ├── hooks/
│   │   ├── useHashConnect.ts      # Wallet connection hook
│   │   └── useCircle.ts           # Circle contract interactions
│   ├── lib/
│   │   ├── hederaClient.ts        # Server-side Hedera client
│   │   └── constants.ts           # Contract ID and constants
│   ├── store/
│   │   ├── hashconnectSlice.ts     # Redux wallet state
│   │   └── index.ts               # Redux store config
│   └── api/
│       └── circle/
│           └── [circleId]/
│               ├── route.ts       # Circle details API
│               └── members/
│                   └── route.ts  # Members with balances API
```


