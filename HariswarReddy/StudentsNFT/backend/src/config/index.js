require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
  contractAddress: process.env.CONTRACT_ADDRESS,
};