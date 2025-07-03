import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Tooltip,
  Card,
  CardContent,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Category,
  Check,
  Close
} from '@mui/icons-material';
import { collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';

const TransactionTypeManager = () => {
  const [types, setTypes] = useState([]);
  const [newTypeDialog, setNewTypeDialog] = useState(false);
  const [editTypeDialog, setEditTypeDialog] = useState(false);
  const [currentType, setCurrentType] = useState({ name: '', category: 'expense' });
  const [editingType, setEditingType] = useState(null);

  // Fetch transaction types from Firestore
  useEffect(() => {
    const q = query(collection(db, 'transactionTypes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const typesData = [];
      querySnapshot.forEach((doc) => {
        typesData.push({ id: doc.id, ...doc.data() });
      });
      setTypes(typesData);
    });
    return unsubscribe;
  }, []);

  const handleAddType = async () => {
    if (!currentType.name.trim()) return;
    
    try {
      await addDoc(collection(db, 'transactionTypes'), {
        name: currentType.name.trim(),
        category: currentType.category,
        createdAt: new Date()
      });
      setCurrentType({ name: '', category: 'expense' });
      setNewTypeDialog(false);
    } catch (error) {
      console.error('Error adding transaction type:', error);
    }
  };

  const handleUpdateType = async () => {
    if (!currentType.name.trim() || !editingType) return;
    
    try {
      await updateDoc(doc(db, 'transactionTypes', editingType.id), {
        name: currentType.name.trim(),
        category: currentType.category,
        updatedAt: new Date()
      });
      setCurrentType({ name: '', category: 'expense' });
      setEditTypeDialog(false);
      setEditingType(null);
    } catch (error) {
      console.error('Error updating transaction type:', error);
    }
  };

  const handleDeleteType = async (typeId) => {
    try {
      await deleteDoc(doc(db, 'transactionTypes', typeId));
    } catch (error) {
      console.error('Error deleting transaction type:', error);
    }
  };

  const openEditDialog = (type) => {
    setEditingType(type);
    setCurrentType({ name: type.name, category: type.category });
    setEditTypeDialog(true);
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Category color="primary" />
              Transaction Types
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={() => {
                setCurrentType({ name: '', category: 'expense' });
                setNewTypeDialog(true);
              }}
              size="small"
            >
              Add Type
            </Button>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {types.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              No custom transaction types yet. Add your first one!
            </Typography>
          ) : (
            <List dense>
              <AnimatePresence>
                {types.map((type) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ListItem
                      secondaryAction={
                        <Box>
                          <Tooltip title="Edit">
                            <IconButton edge="end" onClick={() => openEditDialog(type)} size="small">
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              edge="end" 
                              onClick={() => handleDeleteType(type.id)} 
                              color="error"
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText 
                        primary={type.name} 
                        secondary={
                          <Chip 
                            label={type.category} 
                            size="small" 
                            color={type.category === 'income' ? 'success' : 'error'} 
                            variant="outlined"
                          />
                        } 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add New Type Dialog */}
      <Dialog open={newTypeDialog} onClose={() => setNewTypeDialog(false)}>
        <DialogTitle>Add Transaction Type</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Type Name"
            fullWidth
            variant="outlined"
            value={currentType.name}
            onChange={(e) => setCurrentType({ ...currentType, name: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Category />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={currentType.category === 'expense' ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setCurrentType({ ...currentType, category: 'expense' })}
              fullWidth
            >
              Expense
            </Button>
            <Button
              variant={currentType.category === 'income' ? 'contained' : 'outlined'}
              color="success"
              onClick={() => setCurrentType({ ...currentType, category: 'income' })}
              fullWidth
            >
              Income
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTypeDialog(false)} startIcon={<Close />}>
            Cancel
          </Button>
          <Button onClick={handleAddType} variant="contained" startIcon={<Check />}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Type Dialog */}
      <Dialog open={editTypeDialog} onClose={() => setEditTypeDialog(false)}>
        <DialogTitle>Edit Transaction Type</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Type Name"
            fullWidth
            variant="outlined"
            value={currentType.name}
            onChange={(e) => setCurrentType({ ...currentType, name: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Category />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={currentType.category === 'expense' ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setCurrentType({ ...currentType, category: 'expense' })}
              fullWidth
            >
              Expense
            </Button>
            <Button
              variant={currentType.category === 'income' ? 'contained' : 'outlined'}
              color="success"
              onClick={() => setCurrentType({ ...currentType, category: 'income' })}
              fullWidth
            >
              Income
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTypeDialog(false)} startIcon={<Close />}>
            Cancel
          </Button>
          <Button onClick={handleUpdateType} variant="contained" startIcon={<Check />}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionTypeManager;