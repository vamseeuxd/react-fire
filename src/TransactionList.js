import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Grid,
  Paper,
  Divider,
  IconButton,
  Collapse,
  LinearProgress,
  Avatar,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  ExpandMore,
  ExpandLess,
  Analytics,
  Savings,
  ShoppingCart,
  Event,
  Payment,
  Warning,
  Delete,
  Edit,
  Repeat
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { deleteDoc, doc, updateDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const TransactionList = ({ transactions, onTransactionDeleted, onTransactionUpdated }) => {
  const [expanded, setExpanded] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    description: '',
    type: 'expense',
    selectedType: '',
    dueDate: null,
    paymentDate: null,
    isRepeating: false,
    frequency: 'monthly',
    endCondition: 'never',
    endDate: null,
    occurrences: 12
  });
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  const [useCurrentMonth, setUseCurrentMonth] = useState(true);
  
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
  const filteredTransactions = transactions.filter(t => {
    if (useCurrentMonth) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      return t.month === currentMonth && t.year === currentYear;
    } else {
      const transactionDate = dayjs(t.date?.toDate?.() || t.paymentDate?.toDate?.());
      return transactionDate.isBetween(startDate, endDate, 'day', '[]');
    }
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  const handleOpenEditDialog = (transaction) => {
    setTransactionToEdit(transaction);
    setEditFormData({
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      selectedType: transaction.typeId || '',
      dueDate: transaction.dueDate ? dayjs(transaction.dueDate.toDate()) : null,
      paymentDate: transaction.paymentDate ? dayjs(transaction.paymentDate.toDate()) : dayjs(),
      isRepeating: transaction.isRepeating || false,
      frequency: transaction.frequency || 'monthly',
      endCondition: transaction.endCondition || 'never',
      endDate: transaction.endDate ? dayjs(transaction.endDate.toDate()) : null,
      occurrences: transaction.occurrences || 12
    });
    setEditDialogOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (!transactionToEdit || !editFormData.amount || !editFormData.description) return;
    
    try {
      // Find the selected transaction type if any
      const typeDetails = editFormData.selectedType ? 
        transactionTypes.find(t => t.id === editFormData.selectedType) : null;
      
      await updateDoc(doc(db, 'transactions', transactionToEdit.id), {
        amount: parseFloat(editFormData.amount),
        description: editFormData.description,
        type: editFormData.type,
        typeId: editFormData.selectedType || null,
        typeName: typeDetails?.name || null,
        dueDate: editFormData.dueDate ? editFormData.dueDate.toDate() : null,
        paymentDate: editFormData.paymentDate ? editFormData.paymentDate.toDate() : new Date(),
        isRepeating: editFormData.isRepeating,
        frequency: editFormData.isRepeating ? editFormData.frequency : null,
        endCondition: editFormData.isRepeating ? editFormData.endCondition : null,
        endDate: editFormData.isRepeating && editFormData.endDate ? editFormData.endDate.toDate() : null,
        occurrences: editFormData.isRepeating ? editFormData.occurrences : null,
        updatedAt: new Date()
      });
      
      setEditDialogOpen(false);
      setTransactionToEdit(null);
      if (onTransactionUpdated) {
        onTransactionUpdated(transactionToEdit);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };
  
  const handleDeleteTransaction = async () => {
    if (transactionToDelete) {
      try {
        await deleteDoc(doc(db, 'transactions', transactionToDelete.id));
        setDeleteDialogOpen(false);
        setTransactionToDelete(null);
        if (onTransactionDeleted) {
          onTransactionDeleted(transactionToDelete);
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  return (
    <>
      <Box>
        {/* Enhanced Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>Total Income</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>${totalIncome.toFixed(2)}</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <TrendingUp sx={{ fontSize: 30 }} />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #f44336, #ff5722)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>Total Expenses</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>${totalExpenses.toFixed(2)}</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <ShoppingCart sx={{ fontSize: 30 }} />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card sx={{ 
                  background: balance >= 0 
                    ? 'linear-gradient(135deg, #2196f3, #21cbf3)'
                    : 'linear-gradient(135deg, #ff9800, #f57c00)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>Net Balance</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>${balance.toFixed(2)}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Savings Rate: {savingsRate.toFixed(1)}%</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <Savings sx={{ fontSize: 30 }} />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>

        {/* Savings Progress */}
        {totalIncome > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 203, 243, 0.1))' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Analytics color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Savings Goal Progress</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(Math.max(savingsRate, 0), 100)} 
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {savingsRate >= 20 ? '🎉 Excellent savings rate!' : savingsRate >= 10 ? '👍 Good progress!' : '💪 Keep building your savings!'}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Enhanced Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                  <Receipt color="primary" />
                  Recent Transactions ({filteredTransactions.length})
                </Typography>
                <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
                  <IconButton onClick={() => setExpanded(!expanded)} color="primary">
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useCurrentMonth}
                      onChange={(e) => setUseCurrentMonth(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Current Month Only"
                />
                {!useCurrentMonth && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small"
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small"
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
              
              <Collapse in={expanded}>
                <Divider sx={{ mb: 2 }} />
                {filteredTransactions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Receipt sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No transactions found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start by adding your first transaction above
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    <AnimatePresence>
                      {filteredTransactions.map((transaction, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <ListItem sx={{ 
                            border: 1, 
                            borderColor: 'divider', 
                            borderRadius: 2, 
                            mb: 1,
                            background: transaction.type === 'income' 
                              ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1))'
                              : 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(255, 87, 34, 0.1))',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }
                          }}>
                            <ListItemIcon>
                              <Avatar sx={{ 
                                bgcolor: transaction.type === 'income' ? 'success.main' : 'error.main',
                                width: 40,
                                height: 40
                              }}>
                                {transaction.type === 'income' ? <TrendingUp /> : <TrendingDown />}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {transaction.description}
                                    </Typography>
                                    {transaction.typeName && (
                                      <Chip 
                                        label={transaction.typeName}
                                        size="small"
                                        variant="outlined"
                                        color={transaction.type === 'income' ? 'success' : 'error'}
                                        sx={{ mt: 0.5 }}
                                      />
                                    )}
                                  </Box>
                                  <Chip 
                                    label={`${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}`}
                                    color={transaction.type === 'income' ? 'success' : 'error'}
                                    variant="filled"
                                    sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block' }}>
                                    Payment: {transaction.paymentDate?.toDate?.()?.toLocaleDateString() || transaction.date?.toDate?.()?.toLocaleDateString() || 'Date not available'}
                                  </Typography>
                                  {transaction.dueDate && (
                                    <Typography variant="caption" color="warning.main" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                      <Event sx={{ fontSize: 12 }} />
                                      Due: {transaction.dueDate.toDate?.()?.toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Box>
                              <Tooltip title="Edit Transaction">
                                <IconButton 
                                  edge="end" 
                                  aria-label="edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditDialog(transaction);
                                  }}
                                  sx={{ ml: 1 }}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Transaction">
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransactionToDelete(transaction);
                                    setDeleteDialogOpen(true);
                                  }}
                                  sx={{ ml: 1 }}
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItem>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </List>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
      
      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 600 }}>
          Confirm Transaction Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this {transactionToDelete?.type} transaction: 
            <strong>{transactionToDelete?.description}</strong> for 
            <strong>${transactionToDelete?.amount?.toFixed(2)}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteTransaction} 
            color="error" 
            variant="contained"
            autoFocus
            startIcon={<Delete />}
            sx={{ fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Transaction Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        aria-labelledby="edit-dialog-title"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle id="edit-dialog-title" sx={{ fontWeight: 600 }}>
          Edit Transaction
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant={editFormData.type === 'expense' ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => setEditFormData({...editFormData, type: 'expense'})}
                    fullWidth
                  >
                    Expense
                  </Button>
                  <Button
                    variant={editFormData.type === 'income' ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => setEditFormData({...editFormData, type: 'income'})}
                    fullWidth
                  >
                    Income
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="edit-type-label">Transaction Type</InputLabel>
                  <Select
                    labelId="edit-type-label"
                    value={editFormData.selectedType}
                    onChange={(e) => setEditFormData({...editFormData, selectedType: e.target.value})}
                    label="Transaction Type"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {transactionTypes
                      .filter(t => t.category === editFormData.type)
                      .map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Payment Date"
                  value={editFormData.paymentDate}
                  onChange={(newValue) => setEditFormData({...editFormData, paymentDate: newValue})}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal"
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Due Date (Optional)"
                  value={editFormData.dueDate}
                  onChange={(newValue) => setEditFormData({...editFormData, dueDate: newValue})}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal"
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editFormData.isRepeating}
                      onChange={(e) => setEditFormData({...editFormData, isRepeating: e.target.checked})}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Repeat color="primary" />
                      <Typography>Recurring Transaction</Typography>
                    </Box>
                  }
                />
              </Grid>
              
              <Collapse in={editFormData.isRepeating}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Frequency</InputLabel>
                      <Select
                        value={editFormData.frequency}
                        onChange={(e) => setEditFormData({...editFormData, frequency: e.target.value})}
                        label="Frequency"
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="yearly">Yearly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>End Condition</InputLabel>
                      <Select
                        value={editFormData.endCondition}
                        onChange={(e) => setEditFormData({...editFormData, endCondition: e.target.value})}
                        label="End Condition"
                      >
                        <MenuItem value="never">Never (12 occurrences)</MenuItem>
                        <MenuItem value="occurrences">After specific occurrences</MenuItem>
                        <MenuItem value="date">On specific date</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {editFormData.endCondition === 'occurrences' && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Occurrences"
                        value={editFormData.occurrences}
                        onChange={(e) => setEditFormData({...editFormData, occurrences: parseInt(e.target.value) || 1})}
                        inputProps={{ min: 1, max: 60 }}
                      />
                    </Grid>
                  )}
                  
                  {editFormData.endCondition === 'date' && (
                    <Grid item xs={12} sm={4}>
                      <DatePicker
                        label="End Date"
                        value={editFormData.endDate}
                        onChange={(newValue) => setEditFormData({...editFormData, endDate: newValue})}
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
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateTransaction} 
            color="primary" 
            variant="contained"
            startIcon={<Edit />}
            sx={{ fontWeight: 600 }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionList;