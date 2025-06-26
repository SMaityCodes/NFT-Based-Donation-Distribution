# NFT-Based Donation Distribution System

A decentralized platform that revolutionizes education funding through transparent blockchain donations and meaningful NFTs. This system connects donors, students, vendors, and educational foundations to create a transparent and impactful giving experience.

## 🎯 Project Overview

The NFT-Based Donation Distribution System is a full-stack web3 application that leverages blockchain technology to:

- **Transparent Donations**: Every donation is traceable on the blockchain
- **Student NFTs**: Approved students receive unique NFTs that can be used for educational purchases
- **Multi-Role System**: Supports donors, students, vendors, and administrators
- **Campaign Management**: Create and manage educational funding campaigns
- **Vendor Integration**: Connect students with approved vendors for educational purchases

## 🏗️ System Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite
- **UI Library**: Material-UI (MUI) with Chakra UI components
- **State Management**: Zustand for global state
- **Routing**: React Router DOM
- **Web3 Integration**: Ethers.js for blockchain interaction
- **Styling**: Material-UI theming with dark/light mode support

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcryptjs
- **File Upload**: Multer with Cloudinary integration
- **Blockchain**: Ethers.js for smart contract interaction
- **CORS**: Configured for cross-origin requests

### Smart Contract (Solidity)
- **Standard**: ERC-721 (NFT) with OpenZeppelin contracts
- **Features**: 
  - Campaign creation and management
  - Student registration and approval
  - NFT minting for approved students
  - Vendor registration and verification
  - NFT usage tracking

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- MetaMask or Web3 wallet
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd NFT-Based-Donation-Distribution
```

### 2. Backend Setup

```bash
cd newStudentsNFT/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Configure your `.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/students-nft

# JWT
JWT_SECRET=your_jwt_secret_here

# Blockchain
CONTRACT_ADDRESS=your_deployed_contract_address
RPC_URL=your_ethereum_rpc_url

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3001
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Configure your `.env` file:
```env
VITE_API_URL=http://localhost:3001/api
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_RPC_URL=your_ethereum_rpc_url
```

### 4. Start the Application

**Backend:**
```bash
cd newStudentsNFT/backend
npm run dev
```

**Frontend:**
```bash
cd newStudentsNFT/frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 👥 User Roles & Features

### 🎓 Students
- **Registration**: Register for campaigns with admission letters
- **Profile Management**: View and update student information
- **NFT Collection**: View minted NFTs and their usage history
- **Campaign Browsing**: Explore available educational campaigns

### 💰 Donors
- **Campaign Discovery**: Browse and search for campaigns
- **Donation Tracking**: View donation history and impact
- **NFT Collection**: Collect NFTs from supported campaigns
- **Transparency**: Track how donations are used

### 🏪 Vendors
- **Registration**: Register as approved educational vendors
- **Transaction Management**: Process NFT-based transactions
- **Verification**: Verify student NFTs for purchases
- **Profile Management**: Update vendor information

### 👨‍💼 Administrators
- **Campaign Management**: Create and manage funding campaigns
- **Student Approval**: Review and approve student applications
- **Vendor Management**: Register and manage approved vendors
- **System Monitoring**: Monitor donations and NFT usage

## 🔧 Smart Contract Features

### Campaign Management
```solidity
function createCampaign(
    string memory name,
    string[] memory allowedSchoolTypes,
    Standard[] memory allowedStandards
) external onlyOwner
```

### Student Registration
```solidity
function registerForCampaign(
    uint campaignId,
    string memory studentSchoolType,
    Standard studentStandard,
    bytes32 admissionLetterHash
) external
```

### NFT Minting
```solidity
function approveStudent(uint studentId, string memory tokenURII) external onlyOwner
```

### Vendor Verification
```solidity
function verifyAndUseNFT(uint nftId) external
```

## 📁 Project Structure

```
newStudentsNFT/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and contract configuration
│   │   ├── controllers/     # API route handlers
│   │   ├── middleware/      # Authentication and upload middleware
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic and blockchain services
│   │   └── server.js        # Express server setup
│   ├── uploads/             # File upload directory
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand state management
│   │   ├── utils/           # Utility functions
│   │   └── App.jsx          # Main application component
│   └── package.json
```

## 🔐 Security Features

- **JWT Authentication**: Secure API access with JSON Web Tokens
- **Password Hashing**: bcryptjs for secure password storage
- **File Upload Security**: Multer with file type validation
- **CORS Protection**: Configured cross-origin request handling
- **Input Validation**: Comprehensive request validation
- **Blockchain Security**: Smart contract access controls

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign details

### Students
- `POST /api/students` - Register student
- `GET /api/students` - Get all students
- `PUT /api/students/:id/approve` - Approve student

### NFTs
- `GET /api/nft/student/:address` - Get student NFTs
- `POST /api/nft/mint` - Mint NFT for student

## 🛠️ Development

### Adding New Features
1. Create database models in `backend/src/models/`
2. Add API routes in `backend/src/routes/`
3. Implement controllers in `backend/src/controllers/`
4. Create frontend components in `frontend/src/components/`
5. Add pages in `frontend/src/pages/`
6. Update routing in `frontend/src/routes.jsx`

### Testing
```bash
# Backend tests
cd newStudentsNFT/backend
npm test

# Frontend tests
cd newStudentsNFT/frontend
npm test
```

### Building for Production
```bash
# Backend
cd newStudentsNFT/backend
npm run build

# Frontend
cd newStudentsNFT/frontend
npm run build
```

## 🔗 Blockchain Integration

### Smart Contract Deployment
1. Deploy the `StudentFund.sol` contract to your preferred network
2. Update `CONTRACT_ADDRESS` in environment variables
3. Configure RPC URL for network connectivity

### Web3 Integration
- Frontend uses Ethers.js for blockchain interaction
- Backend provides blockchain service layer
- MetaMask integration for wallet connectivity

## 📊 Database Schema

### Student Model
```javascript
{
  address: String,           // Ethereum address
  schoolType: String,        // Government/Private/International
  standard: Number,          // Grade level
  campaignId: Number,        // Associated campaign
  admissionLetterUrl: String, // Document URL
  approved: Boolean,         // Approval status
  nftMinted: Boolean,        // NFT minting status
  nftId: Number             // NFT token ID
}
```

### Campaign Model
```javascript
{
  name: String,              // Campaign name
  description: String,       // Campaign description
  targetAmount: Number,      // Funding target
  raisedAmount: Number,      // Current raised amount
  active: Boolean,           // Campaign status
  allowedSchoolTypes: [String], // Eligible school types
  allowedStandards: [Number],   // Eligible grade levels
  donors: [Object]           // Donor information
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the code comments
- Review the API endpoints and smart contract functions

## 🔮 Future Enhancements

- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] Automated NFT metadata generation
- [ ] Integration with educational institutions
- [ ] Advanced vendor marketplace
- [ ] Real-time notifications
- [ ] Advanced reporting features

---

**Built with ❤️ for transparent education funding**
