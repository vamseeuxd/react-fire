import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionList from './TransactionList';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Mock Firebase
jest.mock('./firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  deleteDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(),
}));

const theme = createTheme();

describe('TransactionList Component', () => {
  const mockTransactions = [
    {
      id: '1',
      amount: 100,
      description: 'Test Income',
      type: 'income',
      date: { toDate: () => new Date() },
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
    {
      id: '2',
      amount: 50,
      description: 'Test Expense',
      type: 'expense',
      date: { toDate: () => new Date() },
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  ];

  const renderComponent = (transactions = mockTransactions) => {
    return render(
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TransactionList transactions={transactions} />
        </LocalizationProvider>
      </ThemeProvider>
    );
  };

  test('renders transactions and allows deletion', async () => {
    renderComponent();
    
    // Check if transactions are rendered
    expect(screen.getByText('Test Income')).toBeInTheDocument();
    expect(screen.getByText('Test Expense')).toBeInTheDocument();
    
    // Find delete buttons (there should be two)
    const deleteButtons = screen.getAllByLabelText('delete');
    expect(deleteButtons).toHaveLength(2);
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Confirm the dialog appears
    expect(screen.getByText(/Confirm Transaction Deletion/i)).toBeInTheDocument();
    
    // Click the delete button in the dialog
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);
    
    // Verify deleteDoc was called
    await waitFor(() => {
      expect(require('firebase/firestore').deleteDoc).toHaveBeenCalled();
    });
  });
});