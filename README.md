# CirclePool 🏦

**Transform your savings group into a community bank**

CirclePool brings the traditional rotating savings model online, but with a powerful twist: a portion of each payout (set by the circle creator) stays in the group fund, creating a growing reserve that enables micro-loans and sustainable wealth building for your community.

## 🌟 Features

- **💼 Savings Circles**: Create and manage rotating savings groups
- **💰 Micro-Loans**: Enable loans from the growing group fund with interest
- **🔐 Blockchain-Powered**: Built on Hedera Hashgraph for secure, transparent transactions
- **👥 Member Management**: Easy member onboarding and payout order management
- **📊 Real-time Tracking**: Monitor balances, payments, and loan status
- **🔔 Notifications**: Stay updated on circle activities and requests
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

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
- **Wallet Integration**: HashConnect (HashPack, Blade, etc.)
- **API Routes**: Next.js API Routes

### Smart Contracts
- **Framework**: Hardhat
- **Language**: Solidity ^0.8.28
- **Network**: Hedera Hashgraph Testnet/Mainnet

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
- HashPack or compatible Hedera wallet

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

1. Connect your Hedera wallet using HashConnect
2. Navigate to "Create Circle"
3. Fill in circle details:
   - Circle name
   - Contribution amount
   - Start date
   - Cycle time (days between payments)
   - Maximum members
   - Interest percentage (for loans)
   - Left percentage (reserve fund)
4. Submit to create the circle on-chain

### Joining a Circle

1. Browse available circles
2. Request to join a circle
3. Wait for admin approval
4. Once approved, deposit your contribution

### Requesting a Loan

1. Navigate to "My Loans"
2. Select the circle
3. Enter loan amount and duration
4. Submit loan request
5. Wait for approval and funds transfer

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

## 🙏 Acknowledgments

- Built on [Hedera Hashgraph](https://hedera.com/)
- Powered by [HashConnect](https://www.hashpack.app/)
- UI components from [Lucide](https://lucide.dev/)




