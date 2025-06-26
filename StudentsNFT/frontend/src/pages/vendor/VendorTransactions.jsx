import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

const VendorTransactions = () => {
  const { contract, account } = useWeb3Store();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get all transactions for the vendor
        const transactionCount = await contract.getVendorTransactionCount(account);
        const transactionPromises = [];

        for (let i = 0; i < transactionCount; i++) {
          const tx = await contract.vendorTransactions(account, i);
          transactionPromises.push(tx);
        }

        const transactionResults = await Promise.all(transactionPromises);
        const formattedTransactions = transactionResults.map((tx, index) => ({
          id: index,
          student: tx.student,
          amount: ethers.formatEther(tx.amount),
          timestamp: new Date(tx.timestamp.toNumber() * 1000).toLocaleString(),
          status: tx.status // 0: Pending, 1: Approved, 2: Rejected
        }));

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [contract, account]);

  const handleApproveTransaction = async () => {
    if (!selectedTransaction || !amount) return;

    try {
      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.approveTransaction(
        selectedTransaction.student,
        amountInWei
      );
      await tx.wait();
      
      toast.success('Transaction approved successfully');
      setOpenDialog(false);
      setSelectedTransaction(null);
      setAmount('');
      // Refresh transactions
      const transactionCount = await contract.getVendorTransactionCount(account);
      const transactionPromises = [];

      for (let i = 0; i < transactionCount; i++) {
        const tx = await contract.vendorTransactions(account, i);
        transactionPromises.push(tx);
      }

      const transactionResults = await Promise.all(transactionPromises);
      const formattedTransactions = transactionResults.map((tx, index) => ({
        id: index,
        student: tx.student,
        amount: ethers.formatEther(tx.amount),
        timestamp: new Date(tx.timestamp.toNumber() * 1000).toLocaleString(),
        status: tx.status
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('Failed to approve transaction');
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 0:
        return <Chip label="Pending" color="warning" />;
      case 1:
        return <Chip label="Approved" color="success" />;
      case 2:
        return <Chip label="Rejected" color="error" />;
      default:
        return <Chip label="Unknown" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Vendor Transactions
      </Typography>

      {transactions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No transactions found.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Address</TableCell>
                <TableCell>Amount (ETH)</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {`${transaction.student.substring(0, 6)}...${transaction.student.substring(transaction.student.length - 4)}`}
                  </TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{transaction.timestamp}</TableCell>
                  <TableCell>{getStatusChip(transaction.status)}</TableCell>
                  <TableCell>
                    {transaction.status === 0 && (
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setOpenDialog(true);
                        }}
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Approve Transaction</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (ETH)"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              inputProps: { min: 0, step: 0.01 }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleApproveTransaction} color="primary">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorTransactions; 