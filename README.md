# CampaignNFT - NFT-Based Educational Donation System

A decentralized platform that revolutionizes education funding through transparent blockchain donations and meaningful NFTs. This system connects donors, students, vendors, and educational foundations to create a transparent and impactful giving experience.

## 🎯 Project Overview

The CampaignNFT system is a full-stack web application that leverages blockchain technology to:

- **Transparent Donations**: Every donation is traceable on the blockchain
- **Student NFTs**: Approved students receive unique NFTs that can be used for educational purchases
- **Multi-Role System**: Supports donors, students, vendors, and administrators (foundation)
- **Campaign Management**: Create and manage educational funding campaigns
- **Vendor Integration**: Connect students with approved vendors for educational purchases
- **Donation Tracking**: Real-time tracking of campaign donations and donor contributions
- **NFT Usage Management**: Track NFT usage and vendor transactions
- **Standard-Based Funding**: Predefined funding amounts for different educational standards

## 🏗️ System Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite
- **UI Library**: Material-UI (MUI) with Chakra UI components
- **State Management**: Zustand for global state
- **Routing**: React Router DOM
- **Web3 Integration**: Ethers.js for blockchain interaction
- **Styling**: Material-UI theming with dark/light mode support
- **Notifications**: React Toastify for user feedback

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with wallet-based authentication
- **File Upload**: Multer with Cloudinary integration
- **Blockchain**: Ethers.js for smart contract interaction
- **CORS**: Configured for cross-origin requests

### Smart Contract (Solidity)
- **Standard**: ERC-721 (NFT) with OpenZeppelin contracts
- **Contract Name**: `CampaignNFT` (StudentFund3.sol)
- **Features**: 
  - Campaign creation and management
  - Student registration and approval
  - NFT minting for approved students
  - Vendor registration and verification
  - NFT usage tracking and vendor transactions
  - Donation management and tracking
  - Campaign balance management
  - Standard-based funding amounts
  - IPFS metadata templates for different educational standards

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

Configure your `.env` file with your specific configuration values.

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Configure your `.env` file with your specific configuration values.

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
- **NFT Usage**: Use NFTs for educational purchases from approved vendors

### 💰 Donors
- **Campaign Discovery**: Browse and search for campaigns
- **Donation Tracking**: View donation history and impact
- **Transparency**: Track how donations are used
- **Real-time Donations**: Make donations directly to campaigns
- **Donation History**: View all donations across campaigns

### 🏪 Vendors
- **Registration**: Register as approved educational vendors (admin only)
- **Transaction Management**: Process NFT-based transactions
- **Verification**: Verify student NFTs for purchases
- **Profile Management**: Update vendor information
- **Transaction History**: Track all NFT transactions processed
- **Item Provision**: Record items provided for NFT exchanges

### 👨‍💼 Foundation (Administrators)
- **Campaign Management**: Create and manage funding campaigns
- **Student Approval**: Review and approve student applications
- **Vendor Management**: Register and manage approved vendors
- **System Monitoring**: Monitor donations and NFT usage
- **Campaign Balance**: Monitor campaign funding levels
- **Donor Analytics**: View comprehensive donor statistics
- **Admission Letter Management**: Review and approve student documents

## 🔧 Smart Contract Features (CampaignNFT)

### Campaign Management
```solidity
function createCampaign(
    string memory name,
    string[] memory allowedSchoolTypes,
    Standard[] memory allowedStandards
) external onlyOwner

function getAllCampaigns() external view returns (Campaign[] memory)
```

### Donation System
```solidity
function donateToCampaign(uint campaignId) external payable

function getDonorsByCampaign(uint campaignId) external view returns (Donor[] memory)

function getAllDonorsWithCampaignAmounts() external view onlyOwner returns (
    address[] memory donorAddresses,
    uint[] memory totalDonatedAmounts,
    uint[][] memory donatedPerCampaign
)
```

### Student Registration
```solidity
function registerForCampaign(
    uint campaignId,
    string memory studentSchoolType,
    Standard studentStandard,
    bytes32 admissionLetterHash
) external

function getStudentsByCampaign(uint campaignId) external view returns (Student[] memory)
```

### NFT Minting & Management
```solidity
function approveStudent(uint studentId) external onlyOwner

function setStandardTokenURITemplates() external onlyOwner

function getNFTDetails(uint nftId) external view returns (
    Standard standard,
    uint amount,
    bool isUsed,
    address currentOwner
)
```

### Vendor Transactions
```solidity
function verifyAndUseNFT(uint nftId, string memory itemProvided) external

function getVendorTransaction(uint nftId) external view returns (
    uint,
    address,
    string memory,
    uint
)
```

### Campaign Analytics
```solidity
function getCampaignBalance(uint campaignId) external view onlyOwner returns (uint)

function getDonorsWithAmountsByCampaign(uint campaignId) external view onlyOwner returns (address[] memory, uint[] memory)

function getApprovedStudentsByCampaign(uint campaignId) external view returns (Student[] memory)
```

## 📁 Project Structure

```
NFT-Based-Donation-Distribution/
├── Practice/
│   └── StudentFund3.sol          # Main smart contract (CampaignNFT)
├── newStudentsNFT/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/          # Database and contract configuration
│   │   │   ├── controllers/     # API route handlers
│   │   │   ├── middleware/      # Authentication and upload middleware
│   │   │   ├── models/          # MongoDB schemas
│   │   │   ├── routes/          # API routes
│   │   │   ├── services/        # Business logic and blockchain services
│   │   │   ├── app.js           # Express app configuration
│   │   │   └── server.js        # Express server setup
│   │   ├── uploads/             # File upload directory
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── components/      # Reusable UI components
│       │   ├── context/         # React context providers
│       │   ├── pages/           # Page components
│       │   ├── store/           # Zustand state management
│       │   ├── utils/           # Utility functions
│       │   ├── theme.js         # Material-UI theme
│       │   ├── routes.jsx       # Application routing
│       │   ├── App.jsx          # Main application component
│       │   └── main.jsx         # Application entry point
│       └── package.json
└── README.md
```

## 🔐 Security Features

- **JWT Authentication**: Secure API access with JSON Web Tokens
- **Wallet-Based Auth**: Ethereum wallet address verification
- **File Upload Security**: Multer with file type validation
- **CORS Protection**: Configured cross-origin request handling
- **Input Validation**: Comprehensive request validation
- **Blockchain Security**: Smart contract access controls
- **NFT Usage Protection**: Single-use NFTs with transfer verification

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
1. Deploy the `Practice/StudentFund3.sol` contract to your preferred network
2. Update contract configuration in environment variables
3. Set up IPFS metadata templates for different educational standards

### Web3 Integration
- Frontend uses Ethers.js for blockchain interaction
- Backend provides blockchain service layer
- MetaMask integration for wallet connectivity
- Real-time donation tracking and NFT management

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

### NFT Metadata Model
```javascript
{
  tokenId: Number,           // NFT token ID
  name: String,              // NFT name
  description: String,       // NFT description
  image: String,             // NFT image URL
  attributes: [Object],      // NFT attributes
  standard: String,          // Educational standard
  amount: Number,            // Funding amount
  studentAddress: String     // Student's address
}
```

### Vendor Transaction Model
```javascript
{
  nftId: Number,             // NFT token ID
  studentAddress: String,    // Student's address
  itemProvided: String,      // Item/service provided
  timestamp: Date,           // Transaction timestamp
  vendorAddress: String      // Vendor's address
}
```

## 🎓 Educational Standards & Funding

The system supports multiple educational standards with predefined funding amounts:

### Primary Education (Standards 1-5)
- Primary 1-2: ₹1,000 each
- Primary 3-4: ₹1,500 each  
- Primary 5: ₹2,000

### Middle Education (Standards 6-8)
- Middle 6-7: ₹2,500 each
- Middle 8: ₹3,000

### High School (Standards 9-10)
- High 9: ₹3,500
- High 10: ₹4,000

### Intermediate (Standards 11-12)
- Inter 11: ₹4,500
- Inter 12: ₹5,000

### BTech (Years 1-4)
- BTech 1: ₹8,000
- BTech 2: ₹8,500
- BTech 3: ₹9,000
- BTech 4: ₹10,000

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
- Review the smart contract functions

## 🔮 Future Enhancements

- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] Automated NFT metadata generation
- [ ] Integration with educational institutions
- [ ] Advanced vendor marketplace
- [ ] Real-time notifications
- [ ] Advanced reporting features
- [ ] Batch NFT minting
- [ ] Automated campaign funding distribution
- [ ] Integration with traditional payment systems
- [ ] Advanced IPFS integration for metadata storage
- [ ] Multi-language support
- [ ] Advanced role-based access control

---

**Built with ❤️ for transparent education funding**
