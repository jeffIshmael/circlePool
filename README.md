# CirclePool 🏦

**Transform your savings group into a community bank**

CirclePool is a decentralized rotational savings and lending platform built on Hedera Hashgraph. It reimagines traditional chamas (group savings circles) by bringing them on-chain, ensuring transparency, automation, and wealth growth for members, regardless of geography.

Through CirclePool, users can create or join savings circles, contribute funds periodically, and receive payouts in rotation (just like a traditional chama) but with an added twist: **A small portion of every payout is retained in a shared liquidity pool**, enabling **group lending**, **interest earnings**, and **long-term wealth growth**.

## 🌟 Features

- **💼 Savings Circles**: Create and manage rotating savings groups (chamas)
- **💰 Micro-Loans**: Enable loans from the growing group fund with interest
- **🔐 Blockchain-Powered**: Built on Hedera Hashgraph for secure, transparent transactions
- **🌍 Borderless Participation**: Join circles across regions and countries
- **👥 Member Management**: Private invite links and admin approval for secure membership
- **📊 Real-time Tracking**: Monitor balances, payments, loan status, and payout schedules
- **🔔 Notifications**: Stay updated on circle activities and requests
- **⏰ Automated Payouts**: Automated cron jobs for circle start dates and payout processing
- **📅 Payout Order Tracking**: Automatic tracking and display of payout order with pay dates and amounts paid
- **💎 Shared Liquidity Pool**: A percentage of each payout stays in the pool for lending and growth
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🔍 On-chain Transparency**: Every transaction recorded publicly on Hedera network

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Redux Toolkit
- **UI Components**: Lucide React, Framer Motion
- **Notifications**: Sonner

### Backend
- **Database**: PostgreSQL (via Prisma ORM)
- **Blockchain**: Hedera Hashgraph
- **Wallet Integration**: WalletConnect (HashPack, Blade, etc.)
- **API Routes**: Next.js API Routes

### Smart Contracts
- **Framework**: Hardhat
- **Language**: Solidity ^0.8.28
- **Network**: Hedera Hashgraph Testnet

## 🎯 The Problem

Traditional savings groups (chamas, SACCOs, merry-go-rounds, etc.) play a vital role in community finance — but they remain plagued by several challenges:

- **🌍 Geographical Barriers**: Traditional chamas rely on physical meetings and local trust networks, preventing participation from members across regions or countries.

- **👁️ Lack of Transparency**: Traditional chamas depend on manual record-keeping and trust. Mismanagement, fraud, and poor accountability often lead to loss of funds or conflicts among members.

- **🏦 Limited Financial Inclusion**: Many individuals outside formal banking systems rely solely on these informal groups, which restricts access to loans, investments, and credit history.

- **📈 No Mechanism for Wealth Growth**: Once members receive their payout, money leaves the system. There's no structured way to grow the collective pool or enable internal lending with fair interest.

## 💡 The Solution

CirclePool bridges the gap between community finance and decentralized technology. It transforms informal savings circles into digital, borderless, and self-sustaining ecosystems that empower users to save, borrow, and grow wealth transparently:

- **🤖 Smart Contracts Automate Trust**: Contributions, payouts, and loans are managed by Hedera smart contracts, eliminating manual handling and guaranteeing fairness.

- **💎 Shared Liquidity Pool**: A percentage of every payout remains in the collective pool. This pool becomes the group's internal lending and earning mechanism.

- **💰 Borrow and Repay with Interest**: Members can apply for loans directly from the retained pool, paying back with interest that grows the group's overall funds.

- **🌐 Borderless and Inclusive**: Built on Hedera, CirclePool enables participation across regions and currencies — with fast and low-cost transactions.

- **🔍 On-chain Transparency**: Every transaction is recorded publicly on the Hedera network, creating full accountability and visibility for all members.

## 🔄 How CirclePool Works

### 1. Create/Join a Circle

**Creating**: Any user can create a circle and define the circle's parameters:
- Circle name
- Contribution amount (HBAR)
- Period of contribution
- Start date
- Retention percentage (portion kept in pool)
- Loan interest rate

**Joining**: To join an existing circle, you'll need a **private invitation link** shared by the circle admin or an existing member. Once you request to join, the admin reviews and approves your membership before you're officially added to the group. This process keeps circles private and secure, while ensuring only trusted members can participate.

### 2. Contribute Funds

Members contribute funds in HBAR at the defined contribution intervals. All deposits are automatically managed by the CirclePool smart contract, which securely locks and tracks all transactions on Hedera's distributed ledger.

### 3. Payout & Pool Growth

Each round, a designated member receives their payout, while a portion of the contribution (determined by the retention percentage set during circle creation) is retained in the group's shared pool. This retained amount acts as the foundation for the group's internal lending system. Over time, it grows into a sustainable community fund that benefits all members.

### 4. Borrow and Repay

Members can request loans from the retained pool and repay with interest, as defined in the circle's parameters. This process transforms the traditional chama into a self-sustaining ecosystem where funds circulate, generate interest, and expand the collective pool for everyone's benefit.

### 5. Transparent Reporting

CirclePool provides real-time dashboards where members can view the group's balance, contribution records, loan requests, and upcoming payout schedules. Every transaction is recorded on-chain, ensuring complete transparency and accountability within each group.

## 🔒 Security Measures

- **👥 Membership Security**: CirclePool recommends that members form circles with family, friends, or trusted peers. Joining requires a private invite link and admin approval, helping to prevent unauthorized access and maintain trust within the group.

- **🎲 Payout Schedule**: To ensure fairness, CirclePool automatically determines the payout order randomly when a circle starts. This prevents bias and ensures equal opportunity for all members.

- **⏰ Deposit Discipline**: If a payout date arrives and a member has **not made their contribution**, the system automatically refunds all members instead of issuing a payout. This ensures all members contribute fairly.

- **📅 Loan Period**: The maximum loan period is 3 months, ensuring funds remain active and available for future lending.

## ⚠️ Current Limitations

### Loan Defaults

Currently, CirclePool does not have built-in mechanisms to enforce loan repayment or handle default cases. If a member fails to repay a loan or stops contributing after receiving a payout, the contract cannot recover those funds automatically.

**Recommended Solution**: CirclePool encourages forming circles with trusted individuals who share common goals. In future versions, reputation scoring, collateralized loans, or staking-based guarantees may be introduced to mitigate such risks.

## 📁 Project Structure

```
circle-pool/
├── frontend/                 # Next.js application
│   ├── app/                  # App Router pages and components
│   │   ├── api/             # API routes
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── services/        # Business logic services
│   │   └── store/           # Redux store
│   ├── prisma/              # Database schema and migrations
│   └── public/              # Static assets
│
└── hardhat/                 # Smart contract development
    ├── contracts/           # Solidity contracts
    ├── scripts/            # Deployment scripts
    └── test/               # Contract tests
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database
- Hedera account for smart contract deployment
- HashPack or compatible Hedera wallet (via WalletConnect)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd circle-pool
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install smart contract dependencies**
   ```bash
   cd ../hardhat
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `frontend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   HEDERA_NETWORK="testnet"
   HEDERA_OPERATOR_ID="your-operator-id"
   HEDERA_OPERATOR_KEY="your-operator-key"
   HEDERA_RPC_URL="https://testnet.hashio.io/api"
   NEXT_PUBLIC_API_KEY="your-api-key"
   ```

   Create a `.env` file in the `hardhat` directory:
   ```env
   HEDERA_RPC_URL="https://testnet.hashio.io/api"
   HEDERA_PRIVATE_KEY="your-private-key"
   ```

5. **Set up the database**
   ```bash
   cd frontend
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Deploy smart contracts** (optional)
   ```bash
   cd ../hardhat
   npx hardhat run scripts/deploy.ts --network testnet
   ```

### Running the Application

**Development mode:**
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`

**Production build:**
```bash
cd frontend
npm run build
npm start
```

## 🔧 Configuration

### Smart Contract Configuration

Update the contract ID in `frontend/app/lib/constants.ts` after deployment:
```typescript
export const CONTRACT_ID = "0.0.YOUR_CONTRACT_ID";
```

### Database Configuration

The application uses Prisma ORM. To modify the database schema:
1. Edit `frontend/prisma/schema.prisma`
2. Create a migration: `npx prisma migrate dev --name migration-name`
3. Regenerate Prisma Client: `npx prisma generate`

## 📱 Usage

### Creating a Circle

1. Connect your Hedera wallet using WalletConnect
2. Navigate to "Create Circle"
3. Fill in circle details:
   - Circle name
   - Contribution amount (in HBAR)
   - Start date
   - Cycle time (days between payments)
   - Maximum members
   - Interest percentage (for loans)
   - Retention percentage (portion kept in shared pool)
4. Submit to create the circle on-chain

### Joining a Circle

1. Receive a private invitation link from the circle admin or an existing member
2. Click the link to view the circle details
3. Request to join the circle
4. Wait for admin approval
5. Once approved, deposit your contribution at the defined intervals

### Requesting a Loan

1. Navigate to "My Loans"
2. Select the circle
3. Enter loan amount and duration
4. Submit loan request
5. Wait for approval and funds transfer

### Viewing Payout Order

For started circles:
1. Navigate to the circle detail page
2. View the payout order table showing:
   - Member position in payout sequence
   - Scheduled pay date for each member
   - Amount paid (for members who have received payouts)
   - Current balance and loan status

## 🌐 Deployment

### Vercel Deployment

The project is configured for Vercel deployment:

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure these are set in your production environment:
- `DATABASE_URL`
- `HEDERA_NETWORK`
- `HEDERA_OPERATOR_ID`
- `HEDERA_OPERATOR_KEY`
- `NEXT_PUBLIC_API_KEY`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📚 Additional Resources

For detailed information about the blockchain integration, see [BLOCKCHAIN_INTEGRATION.md](./frontend/BLOCKCHAIN_INTEGRATION.md).

## 🙏 Acknowledgments

- Built on [Hedera Hashgraph](https://hedera.com/)
- Powered by [WalletConnect](https://walletconnect.com/) and [HashPack](https://www.hashpack.app/)
- UI components from [Lucide](https://lucide.dev/)




