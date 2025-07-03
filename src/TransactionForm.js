import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, updateDoc } from 'firebase/firestore';
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
  Switch,
  FormControlLabel,
  Divider,
  Collapse
} from '@mui/material';
import { Add, AttachMoney, TrendingUp, TrendingDown, Category, Description, Event, Payment, Repeat } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const TransactionForm = ({ onTransactionAdded }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [dueDate, setDueDate] = useState(dayjs());
  const [paymentDate, setPaymentDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  
  // Repetitive transaction states
  const [isRepeating, setIsRepeating] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [endCondition, setEndCondition] = useState('never');
  const [endDate, setEndDate] = useState(null);
  const [occurrences, setOccurrences] = useState(12);
  
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

  const generateRecurringTransactions = (baseTransaction) => {
    const transactions = [];
    let currentDueDate = dayjs(baseTransaction.dueDate);
    let count = 0;
    const maxTransactions = endCondition === 'occurrences' ? occurrences : 60;
    
    while (count < maxTransactions) {
      if (endCondition === 'date' && endDate && currentDueDate.isAfter(endDate, 'day')) break;
      
      transactions.push({
        ...baseTransaction,
        dueDate: currentDueDate.toDate(),
        date: currentDueDate.toDate(),
        month: currentDueDate.month() + 1,
        year: currentDueDate.year(),
        recurringIndex: count
      });
      
      switch (frequency) {
        case 'daily': currentDueDate = currentDueDate.add(1, 'day'); break;
        case 'weekly': currentDueDate = currentDueDate.add(1, 'week'); break;
        case 'monthly': currentDueDate = currentDueDate.add(1, 'month'); break;
        case 'yearly': currentDueDate = currentDueDate.add(1, 'year'); break;
        default: currentDueDate = currentDueDate.add(1, 'month');
      }
      
      count++;
      if (endCondition === 'never' && count >= 12) break;
      if (endCondition === 'date' && endDate && currentDueDate.isAfter(endDate, 'day')) break;
    }
    
    return transactions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description || !dueDate) return;

    setLoading(true);
    try {
      const typeDetails = selectedType ? 
        transactionTypes.find(t => t.id === selectedType) : null;
      
      const baseTransaction = {
        amount: parseFloat(amount),
        description,
        type,
        typeId: selectedType || null,
        typeName: typeDetails?.name || null,
        dueDate: dueDate.toDate(),
        paymentDate: paymentDate ? paymentDate.toDate() : null,
        isRepeating,
        frequency: isRepeating ? frequency : null,
        endCondition: isRepeating ? endCondition : null,
        endDate: isRepeating && endDate ? endDate.toDate() : null,
        occurrences: isRepeating ? occurrences : null,
        createdAt: new Date()
      };

      if (isRepeating) {
        // Create recurring transactions
        const transactions = generateRecurringTransactions(baseTransaction);
        let masterTransactionId = null;
        
        for (let i = 0; i < transactions.length; i++) {
          const transactionRef = await addDoc(collection(db, 'transactions'), {
            ...transactions[i],
            isMaster: i === 0,
            recurringId: masterTransactionId
          });
          
          if (i === 0) {
            masterTransactionId = transactionRef.id;
            // Update the first transaction to reference itself as master
            await updateDoc(transactionRef, { recurringId: masterTransactionId });
          }
        }
      } else {
        // Single transaction
        await addDoc(collection(db, 'transactions'), {
          ...baseTransaction,
          date: new Date(),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        });
      }
      
      setAmount('');
      setDescription('');
      setDueDate(dayjs());
      setPaymentDate(null);
      setSelectedType('');
      setIsRepeating(false);
      setFrequency('monthly');
      setEndCondition('never');
      setEndDate(null);
      setOccurrences(12);
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
                    label="Due Date *"
                    value={dueDate}
                    onChange={(newValue) => setDueDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
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
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Payment Date (Optional)"
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
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isRepeating}
                        onChange={(e) => setIsRepeating(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Repeat color="primary" />
                        <Typography>Make this a recurring transaction</Typography>
                      </Box>
                    }
                  />
                </Grid>
                
                <Collapse in={isRepeating}>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          label="Frequency"
                        >
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                          <MenuItem value="yearly">Yearly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>End Condition</InputLabel>
                        <Select
                          value={endCondition}
                          onChange={(e) => setEndCondition(e.target.value)}
                          label="End Condition"
                        >
                          <MenuItem value="never">Never (12 occurrences)</MenuItem>
                          <MenuItem value="occurrences">After specific occurrences</MenuItem>
                          <MenuItem value="date">On specific date</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {endCondition === 'occurrences' && (
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Number of Occurrences"
                          value={occurrences}
                          onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, max: 60 }}
                        />
                      </Grid>
                    )}
                    
                    {endCondition === 'date' && (
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          label="End Date"
                          value={endDate}
                          onChange={(newValue) => setEndDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                            },
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Collapse>
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
                      {loading ? 'Processing...' : 
                        isRepeating ? `Create Recurring ${type} Transaction` : `Add ${type} Transaction`
                      }
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