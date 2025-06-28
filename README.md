# CampaignNFT - NFT-Based Educational Donation System

A decentralized platform that revolutionizes education funding through transparent blockchain donations and meaningful NFTs. This system connects donors, students, vendors, and educational foundations to create a transparent and impactful giving experience.

## 🎯 Project Overview

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
- **Contract Name**: `CampaignNFT` (Solidity/StudentFund.sol)
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
cd studentNFT/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Configure your `.env` file with the specific configuration values mentioned below.

#### Change the Cloudinary Name, Api Key, Api Secret, Admin Private Key and Contract address with your actual Values

```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/nft-donation
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
ADMIN_PRIVATE_KEY= YOUR_WALLET_PRIVATE_KEY #Get it from Metamask
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS 
ETHEREUM_RPC_URL=YOUR_INFURA_URL
```


### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Configure your `.env` file with your specific configuration values.


```bash
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS 
```

### 4. Start the Application

**Backend:**
```bash
cd studentNFT/backend
npm run dev
```

**Frontend:**
```bash
cd studentsNFT/frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 👥 User Roles & Features

### 🎓 Students
- Register for campaigns with admission letters
- View minted NFTs and their usage history
- Explore available educational campaigns
- Use NFTs for educational purchases from approved vendors

### 💰 Donors
- Browse and search for campaigns
- Track how donations are used
- Make donations directly to campaigns
- View all donations across campaigns

### 🏪 Vendors
- Register as approved educational vendors (admin only)
- Process NFT-based transactions
- Verify student NFTs for purchases
- Track all NFT transactions processed
- Record items provided for NFT exchanges

### 👨‍💼 Foundation (Administrators)
- Create and manage funding campaigns
- Review and approve student applications
- Register and manage approved vendors
- Monitor donations and NFT usage
- Monitor campaign funding levels
- View comprehensive donor statistics
- Review and approve student documents

## 🔧 Smart Contract Features (StudentFund.sol)

### Campaign Management
```solidity
function createCampaign(string memory name, string[] memory allowedSchoolTypes, Standard[] memory allowedStandards) external onlyOwner;
function getAllCampaigns() external view returns (Campaign[] memory);
```

### Donation System
```solidity
function donateToCampaign(uint campaignId) external payable;
function getAllDonorsWithCampaignAmounts() external view onlyOwner returns (address[] memory donorAddresses, uint[] memory totalDonatedAmounts, uint[][] memory donatedPerCampaign);
```

### Student Registration & Approval
```solidity
function registerForCampaign(uint campaignId, string memory studentSchoolType, Standard studentStandard, bytes32 admissionLetterHash) external;
function approveStudent(uint studentId) external onlyOwner;
function getStudentsByCampaign(uint campaignId) external view returns (Student[] memory);
```

### NFT Minting & Management
```solidity
function setStandardTokenURITemplates() external onlyOwner;
function getNFTDetails(uint nftId) external view returns (Standard standard, uint amount, bool isUsed, address currentOwner);
```

### Vendor Transactions
```solidity
function verifyAndUseNFT(uint nftId, string memory itemProvided) external;
function getVendorTransaction(uint nftId) external view returns (VendorTransaction memory);
```

### Vendor Management
```solidity
function registerVendor(address vendorAddress) external onlyOwner;
function approveVendor(address vendorAddress) external onlyOwner;
```

### Additional Features
- Predefined funding amounts for each educational standard
- Admission letter verification for student registration
- NFT usage tracking and vendor transaction logging

## 📄 Notes
- All blockchain interactions are handled via the smart contract. 
- Go to Remix and Save the StudentFund.sol file from this repo, if you get a warning go to Solidity Compiler and click on Advanced Configuration then you will find a checkbox named Optimization, click it
- Now Go to Deploy and change the Environment to Injected Provider - Metamask
- Deploy the contract then You will get a contract Address paste the contract address in the .env file

## 📬 Contact
For questions or support, please open an issue or contact the project maintainers.

## 📁 Project Structure

```
NFT-Based-Donation-Distribution/
├── Solidity/
│   └── StudentFund.sol          # Main smart contract (CampaignNFT)
├── studentNFT/
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
│   │   |
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


## 🔗 Blockchain Integration

### Smart Contract Deployment
1. Deploy the `Solidity/StudentFund.sol` contract to your preferred network
2. Update contract configuration in environment variables

### Web3 Integration
- Frontend uses Ethers.js for blockchain interaction
- Backend provides blockchain service layer
- MetaMask integration for wallet connectivity
- Real-time donation tracking and NFT management

## 📸 Screenshots

### 🏠 Home & Registration
- [Home Page](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Home%20Page.png)
- [Registered Homepage](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Registered%20Homepage.png)

### 👨‍💼 Admin Dashboard & Management
- [Admin Dashboard](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Admin%20Dashboard.png)
- [Admin Dashbboard 2](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Admin%20Dashboard%202.png)
- [Admin Financial Overview](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Admin%20Financial%20Overview.png)
- [Admin Student Approvals](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Admin%20Student%20Approvals.png)
- [Admin Campaigns](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Admin%20Campaigns.png)
- [Admin Student Management](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Admin%20Student%20Management.png)
- [Admin Vendor Management](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Admin%20Vendor%20Management.png)

### 🎓 Student Interface
- [Student Dashboard](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Student%20Dashboard.png)
- [Student Campaigns](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Student%20Campaigns.png)

### 🏪 Vendor Interface
- [Vendor Dashboard](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Vendor%20Dashboard.png)

### 💰 Donor Interface
- [Donor Dashboard](https://github.com/SMaityCodes/NFT-Based-Donation-Distribution/blob/main/Media/Donar%20Dashboard.png)

## 🎓 Educational Standards & Funding

The system supports multiple educational standards with predefined funding amounts:

### Primary Education (Standards 1-5)
- Primary 1-2: ₹10000 
- Primary 3-4: ₹15000 
- Primary 5: ₹20000

### Middle Education (Standards 6-8)
- Middle 6-7: ₹25000
- Middle 8: ₹30000

### High School (Standards 9-10)
- High 9: ₹35000
- High 10: ₹40000

### Intermediate (Standards 11-12)
- Inter 11: ₹45000
- Inter 12: ₹50000

### BTech (Years 1-4)
- BTech 1: ₹80000
- BTech 2: ₹85000
- BTech 3: ₹90000
- BTech 4: ₹100000

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the code comments
- Review the smart contract functions


---

**Built with Love for transparent education funding**
