import React, { useState } from 'react';
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
  Tooltip
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
  ShoppingCart
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const TransactionList = ({ transactions }) => {
  const [expanded, setExpanded] = useState(true);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(
    t => t.month === currentMonth && t.year === currentYear
  );

  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  return (
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
                Recent Transactions ({monthlyTransactions.length})
              </Typography>
              <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
                <IconButton onClick={() => setExpanded(!expanded)} color="primary">
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            </Box>
            
            <Collapse in={expanded}>
              <Divider sx={{ mb: 2 }} />
              {monthlyTransactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Receipt sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No transactions this month
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start by adding your first transaction above
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  <AnimatePresence>
                    {monthlyTransactions.map((transaction, index) => (
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
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {transaction.description}
                                </Typography>
                                <Chip 
                                  label={`${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}`}
                                  color={transaction.type === 'income' ? 'success' : 'error'}
                                  variant="filled"
                                  sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {transaction.date?.toDate?.()?.toLocaleDateString() || 'Date not available'}
                              </Typography>
                            }
                          />
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
  );
};

export default TransactionList;