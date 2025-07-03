import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import {
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  Grid,
  InputAdornment,
  Chip,
  ButtonGroup,
  Fade
} from '@mui/material';
import { Add, AttachMoney, TrendingUp, TrendingDown, Category, Description, Event, Payment } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const TransactionForm = ({ onTransactionAdded }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [dueDate, setDueDate] = useState(null);
  const [paymentDate, setPaymentDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  
  // Fetch transaction types from Firestore
  useEffect(() => {
    const q = query(collection(db, 'transactionTypes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const typesData = [];
      querySnapshot.forEach((doc) => {
        typesData.push({ id: doc.id, ...doc.data() });
      });
      setTransactionTypes(typesData);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    setLoading(true);
    try {
      // Find the selected transaction type if any
      const typeDetails = selectedType ? 
        transactionTypes.find(t => t.id === selectedType) : null;
      
      await addDoc(collection(db, 'transactions'), {
        amount: parseFloat(amount),
        description,
        type, // Main category (income/expense)
        typeId: selectedType || null, // Reference to custom type
        typeName: typeDetails?.name || null, // Store the name for easier querying
        date: new Date(),
        dueDate: dueDate ? dueDate.toDate() : null,
        paymentDate: paymentDate ? paymentDate.toDate() : new Date(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      
      setAmount('');
      setDescription('');
      setDueDate(null);
      setPaymentDate(dayjs());
      setSelectedType('');
      onTransactionAdded();
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card sx={{ 
          mb: 4, 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'visible'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                <Add color="primary" />
                Quick Transaction
              </Typography>
              <ButtonGroup variant="outlined" size="small">
                <Button 
                  onClick={() => setType('income')}
                  variant={type === 'income' ? 'contained' : 'outlined'}
                  startIcon={<TrendingUp />}
                  color="success"
                >
                  Income
                </Button>
                <Button 
                  onClick={() => setType('expense')}
                  variant={type === 'expense' ? 'contained' : 'outlined'}
                  startIcon={<TrendingDown />}
                  color="error"
                >
                  Expense
                </Button>
              </ButtonGroup>
            </Box>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Chip 
                  label={`Adding ${type}`} 
                  color={type === 'income' ? 'success' : 'error'}
                  icon={type === 'income' ? <TrendingUp /> : <TrendingDown />}
                  sx={{ mb: 3, fontWeight: 600 }}
                />
              </motion.div>
            </AnimatePresence>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney color={type === 'income' ? 'success' : 'error'} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: type === 'income' ? 'success.main' : 'error.main',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Description color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
                    <Select
                      labelId="transaction-type-label"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      label="Transaction Type"
                      startAdornment={
                        <InputAdornment position="start">
                          <Category color="primary" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {transactionTypes
                        .filter(t => t.category === type) // Only show types matching current income/expense selection
                        .map((t) => (
                          <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                        ))
                      }
                    </Select>
                    <FormHelperText>Select a specific transaction type (optional)</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Payment Date"
                    value={paymentDate}
                    onChange={(newValue) => setPaymentDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Payment color="primary" />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Due Date (Optional)"
                    value={dueDate}
                    onChange={(newValue) => setDueDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Event color="warning" />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      fullWidth
                      sx={{ 
                        py: 1.5,
                        background: type === 'income' 
                          ? 'linear-gradient(45deg, #4caf50, #8bc34a)'
                          : 'linear-gradient(45deg, #f44336, #ff5722)',
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}
                    >
                      {loading ? 'Processing...' : `Add ${type} Transaction`}
                    </Button>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default TransactionForm;