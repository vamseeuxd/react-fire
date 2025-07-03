import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
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
  Box,
  Typography,
  Grid,
  InputAdornment,
  Snackbar,
  Alert,
  Chip,
  ButtonGroup,
  Fade,
  Slide
} from '@mui/material';
import { Add, AttachMoney, TrendingUp, TrendingDown, Category, Description } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const TransactionForm = ({ onTransactionAdded }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        amount: parseFloat(amount),
        description,
        type,
        date: new Date(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      
      setAmount('');
      setDescription('');
      setSnackbar({ open: true, message: 'Transaction added successfully!', severity: 'success' });
      onTransactionAdded();
    } catch (error) {
      console.error('Error adding transaction:', error);
      setSnackbar({ open: true, message: 'Error adding transaction', severity: 'error' });
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
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        TransitionComponent={Slide}
      >
        <Alert 
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TransactionForm;