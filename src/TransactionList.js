import { useState, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  ExpandMore,
  ExpandLess,
  Analytics,
  Savings,
  ShoppingCart,
  Event,
  Delete,
  Edit,
  Repeat,
  SelectAll,
  DeleteSweep
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { deleteDoc, doc, updateDoc, collection, query, onSnapshot, addDoc, where, getDocs } from 'firebase/firestore';
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
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
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
  }).sort((a, b) => {
    // Sort by due date first (if exists), then by payment/transaction date
    const aDate = a.dueDate?.toDate?.() || a.paymentDate?.toDate?.() || a.date?.toDate?.();
    const bDate = b.dueDate?.toDate?.() || b.paymentDate?.toDate?.() || b.date?.toDate?.();
    return new Date(bDate) - new Date(aDate);
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
      dueDate: transaction.dueDate ? dayjs(transaction.dueDate.toDate()) : dayjs(),
      paymentDate: transaction.paymentDate ? dayjs(transaction.paymentDate.toDate()) : null,
      isRepeating: transaction.isRepeating || false,
      frequency: transaction.frequency || 'monthly',
      endCondition: transaction.endCondition || 'never',
      endDate: transaction.endDate ? dayjs(transaction.endDate.toDate()) : null,
      occurrences: transaction.occurrences || 12
    });
    setEditDialogOpen(true);
  };

  const generateRecurringTransactions = (baseTransaction) => {
    const transactions = [];
    let currentDueDate = dayjs(baseTransaction.dueDate);
    let count = 0;
    const maxTransactions = baseTransaction.endCondition === 'occurrences' ? baseTransaction.occurrences : 60;
    
    while (count < maxTransactions) {
      if (baseTransaction.endCondition === 'date' && baseTransaction.endDate && currentDueDate.isAfter(dayjs(baseTransaction.endDate), 'day')) break;
      
      transactions.push({
        ...baseTransaction,
        dueDate: currentDueDate.toDate(),
        date: currentDueDate.toDate(),
        month: currentDueDate.month() + 1,
        year: currentDueDate.year(),
        recurringIndex: count
      });
      
      switch (baseTransaction.frequency) {
        case 'daily': currentDueDate = currentDueDate.add(1, 'day'); break;
        case 'weekly': currentDueDate = currentDueDate.add(1, 'week'); break;
        case 'monthly': currentDueDate = currentDueDate.add(1, 'month'); break;
        case 'yearly': currentDueDate = currentDueDate.add(1, 'year'); break;
        default: currentDueDate = currentDueDate.add(1, 'month');
      }
      
      count++;
      if (baseTransaction.endCondition === 'never' && count >= 12) break;
      if (baseTransaction.endCondition === 'date' && baseTransaction.endDate && currentDueDate.isAfter(dayjs(baseTransaction.endDate), 'day')) break;
    }
    
    return transactions;
  };

  const handleUpdateTransaction = async () => {
    if (!transactionToEdit || !editFormData.amount || !editFormData.description || !editFormData.dueDate) {
      console.log('Validation failed:', { transactionToEdit, amount: editFormData.amount, description: editFormData.description, dueDate: editFormData.dueDate });
      return;
    }
    
    try {
      const typeDetails = editFormData.selectedType ? 
        transactionTypes.find(t => t.id === editFormData.selectedType) : null;
      
      const wasRecurring = transactionToEdit.isRepeating;
      const isNowRecurring = editFormData.isRepeating;
      const recurringDataChanged = wasRecurring && isNowRecurring && (
        transactionToEdit.frequency !== editFormData.frequency ||
        transactionToEdit.endCondition !== editFormData.endCondition ||
        transactionToEdit.occurrences !== editFormData.occurrences ||
        (transactionToEdit.endDate?.toMillis?.() || 0) !== (editFormData.endDate?.toDate?.()?.getTime?.() || 0)
      );
      
      if (recurringDataChanged || (!wasRecurring && isNowRecurring)) {
        // Delete existing recurring transactions with same recurringId or created from this transaction
        const recurringQuery = query(
          collection(db, 'transactions'),
          where('recurringId', '==', transactionToEdit.id)
        );
        const recurringSnapshot = await getDocs(recurringQuery);
        for (const docSnap of recurringSnapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
        
        // Also delete transactions that were created as part of the original recurring series
        const originalRecurringQuery = query(
          collection(db, 'transactions'),
          where('createdAt', '>=', transactionToEdit.createdAt || new Date(0))
        );
        const originalSnapshot = await getDocs(originalRecurringQuery);
        for (const docSnap of originalSnapshot.docs) {
          const data = docSnap.data();
          if (data.description === transactionToEdit.description && 
              data.amount === transactionToEdit.amount && 
              data.type === transactionToEdit.type &&
              docSnap.id !== transactionToEdit.id) {
            await deleteDoc(docSnap.ref);
          }
        }
        
        // Generate new recurring transactions
        const baseTransaction = {
          amount: parseFloat(editFormData.amount),
          description: editFormData.description,
          type: editFormData.type,
          typeId: editFormData.selectedType || null,
          typeName: typeDetails?.name || null,
          dueDate: editFormData.dueDate ? editFormData.dueDate.toDate() : null,
          paymentDate: editFormData.paymentDate ? editFormData.paymentDate.toDate() : new Date(),
          isRepeating: true,
          frequency: editFormData.frequency,
          endCondition: editFormData.endCondition,
          endDate: editFormData.endDate ? editFormData.endDate.toDate() : null,
          occurrences: editFormData.occurrences,
          recurringId: transactionToEdit.id,
          createdAt: new Date()
        };
        
        const newTransactions = generateRecurringTransactions(baseTransaction);
        for (const transaction of newTransactions) {
          await addDoc(collection(db, 'transactions'), {
            ...transaction,
            recurringId: transactionToEdit.id
          });
        }
      }
      
      // Update the original transaction
      await updateDoc(doc(db, 'transactions', transactionToEdit.id), {
        amount: parseFloat(editFormData.amount),
        description: editFormData.description,
        type: editFormData.type,
        typeId: editFormData.selectedType || null,
        typeName: typeDetails?.name || null,
        dueDate: editFormData.dueDate.toDate(),
        paymentDate: editFormData.paymentDate ? editFormData.paymentDate.toDate() : null,
        isRepeating: editFormData.isRepeating,
        frequency: editFormData.isRepeating ? editFormData.frequency : null,
        endCondition: editFormData.isRepeating ? editFormData.endCondition : null,
        endDate: editFormData.isRepeating && editFormData.endDate ? editFormData.endDate.toDate() : null,
        occurrences: editFormData.isRepeating ? editFormData.occurrences : null,
        updatedAt: new Date()
      });
      
      if (onTransactionUpdated) {
        onTransactionUpdated({
          ...transactionToEdit,
          ...editFormData,
          amount: parseFloat(editFormData.amount),
          isRepeating: editFormData.isRepeating,
          frequency: editFormData.isRepeating ? editFormData.frequency : null
        });
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      // Always close dialog and reset state
      setEditDialogOpen(false);
      setTransactionToEdit(null);
      setEditFormData({
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

  const handleBulkDelete = async () => {
    try {
      for (const transactionId of selectedTransactions) {
        await deleteDoc(doc(db, 'transactions', transactionId));
      }
      setBulkDeleteDialogOpen(false);
      setSelectedTransactions([]);
      if (onTransactionDeleted) {
        selectedTransactions.forEach(id => {
          const transaction = filteredTransactions.find(t => t.id === id);
          if (transaction) onTransactionDeleted(transaction);
        });
      }
    } catch (error) {
      console.error('Error deleting transactions:', error);
    }
  };

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTransactions(
      selectedTransactions.length === filteredTransactions.length 
        ? [] 
        : filteredTransactions.map(t => t.id)
    );
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                    <Receipt color="primary" />
                    Recent Transactions ({filteredTransactions.length})
                  </Typography>
                  {selectedTransactions.length > 0 && (
                    <Chip 
                      label={`${selectedTransactions.length} selected`}
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {filteredTransactions.length > 0 && (
                    <>
                      <Tooltip title="Select All">
                        <IconButton onClick={handleSelectAll} color="primary" size="small">
                          <SelectAll />
                        </IconButton>
                      </Tooltip>
                      {selectedTransactions.length > 0 && (
                        <Tooltip title="Delete Selected">
                          <IconButton 
                            onClick={() => setBulkDeleteDialogOpen(true)} 
                            color="error" 
                            size="small"
                          >
                            <DeleteSweep />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                  <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
                    <IconButton onClick={() => setExpanded(!expanded)} color="primary">
                      {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Tooltip>
                </Box>
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
                          key={`${transaction.id}-${transaction.updatedAt?.toMillis?.() || transaction.date?.toMillis?.()}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <ListItem sx={{ 
                            border: 1, 
                            borderColor: transaction.dueDate && dayjs(transaction.dueDate.toDate()).isBefore(dayjs(), 'day') 
                              ? 'error.main' : 'divider',
                            borderRadius: 2, 
                            mb: 2,
                            p: 3,
                            background: transaction.dueDate && dayjs(transaction.dueDate.toDate()).isBefore(dayjs(), 'day')
                              ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(255, 87, 34, 0.2))'
                              : transaction.type === 'income' 
                                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1))'
                                : 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(255, 87, 34, 0.1))',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }
                          }}>
                            <ListItemIcon>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Checkbox
                                  checked={selectedTransactions.includes(transaction.id)}
                                  onChange={() => handleSelectTransaction(transaction.id)}
                                  size="small"
                                  color="primary"
                                />
                                <Avatar sx={{ 
                                  bgcolor: transaction.type === 'income' ? 'success.main' : 'error.main',
                                  width: 40,
                                  height: 40
                                }}>
                                  {transaction.type === 'income' ? <TrendingUp /> : <TrendingDown />}
                                </Avatar>
                              </Box>
                            </ListItemIcon>
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1, mr: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                    {transaction.description}
                                  </Typography>
                                  {transaction.isRepeating && (
                                    <Repeat sx={{ fontSize: 20, color: 'primary.main' }} />
                                  )}
                                </Box>
                                
                                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                  {transaction.typeName && (
                                    <Chip 
                                      label={transaction.typeName}
                                      size="small"
                                      variant="outlined"
                                      color={transaction.type === 'income' ? 'success' : 'error'}
                                    />
                                  )}
                                  {transaction.isRepeating && (
                                    <Chip 
                                      label={`${transaction.frequency} recurring`}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      icon={<Repeat />}
                                    />
                                  )}
                                </Box>
                                <Box>
                                  {transaction.dueDate ? (
                                    <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                      <Event sx={{ fontSize: 16 }} />
                                      Due: {transaction.dueDate.toDate?.()?.toLocaleDateString()}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                                      Payment: {transaction.paymentDate?.toDate?.()?.toLocaleDateString() || transaction.date?.toDate?.()?.toLocaleDateString() || 'Date not available'}
                                    </Typography>
                                  )}
                                  {transaction.dueDate && transaction.paymentDate && (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, display: 'block' }}>
                                      Paid: {transaction.paymentDate.toDate?.()?.toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                <Chip 
                                  label={`${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}`}
                                  color={transaction.type === 'income' ? 'success' : 'error'}
                                  variant="filled"
                                  sx={{ fontWeight: 700, fontSize: '1rem', minWidth: '100px' }}
                                />
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Edit Transaction">
                                    <IconButton 
                                      aria-label="edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditDialog(transaction);
                                      }}
                                      color="primary"
                                      size="medium"
                                      sx={{ 
                                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                                      }}
                                    >
                                      <Edit sx={{ fontSize: 20 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Transaction">
                                    <IconButton 
                                      aria-label="delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTransactionToDelete(transaction);
                                        setDeleteDialogOpen(true);
                                      }}
                                      color="error"
                                      size="medium"
                                      sx={{ 
                                        bgcolor: 'rgba(211, 47, 47, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.2)' }
                                      }}
                                    >
                                      <Delete sx={{ fontSize: 20 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
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
                  label="Due Date *"
                  value={editFormData.dueDate}
                  onChange={(newValue) => setEditFormData({...editFormData, dueDate: newValue})}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      required: true
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Payment Date (Optional)"
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
      
      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        aria-labelledby="bulk-delete-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle id="bulk-delete-dialog-title" sx={{ fontWeight: 600 }}>
          Delete Multiple Transactions
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedTransactions.length} selected transactions?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setBulkDeleteDialogOpen(false)} 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBulkDelete} 
            color="error" 
            variant="contained"
            startIcon={<DeleteSweep />}
            sx={{ fontWeight: 600 }}
          >
            Delete {selectedTransactions.length} Transactions
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionList;