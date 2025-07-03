import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Typography, CssBaseline, Box, IconButton, AppBar, Toolbar, Fab, Zoom } from '@mui/material';
import { AccountBalance, DarkMode, LightMode, Add } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const ThemeContext = createContext();

const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#00e676' : '#1565c0',
      light: mode === 'dark' ? '#66ffa6' : '#5e92f3',
      dark: mode === 'dark' ? '#00b248' : '#003c8f',
    },
    secondary: {
      main: mode === 'dark' ? '#ff6d00' : '#e91e63',
      light: mode === 'dark' ? '#ff9e40' : '#f06292',
      dark: mode === 'dark' ? '#c43e00' : '#ad1457',
    },
    background: {
      default: mode === 'dark' ? '#0a0a0a' : '#f8fafc',
      paper: mode === 'dark' ? '#1a1a1a' : '#ffffff',
    },
    success: {
      main: mode === 'dark' ? '#00e676' : '#4caf50',
      light: mode === 'dark' ? '#66ffa6' : '#81c784',
    },
    error: {
      main: mode === 'dark' ? '#ff5722' : '#f44336',
      light: mode === 'dark' ? '#ff8a65' : '#ef5350',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const [transactions, setTransactions] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [showFab, setShowFab] = useState(false);

  const theme = createAppTheme(darkMode ? 'dark' : 'light');

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionData = [];
      querySnapshot.forEach((doc) => {
        transactionData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(transactionData);
    });

    const handleScroll = () => setShowFab(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleTransactionAdded = () => {
    // Transactions will be updated automatically via onSnapshot
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', backdropFilter: 'blur(20px)' }}>
          <Toolbar>
            <AccountBalance sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 600 }}>
              FinanceTracker Pro
            </Typography>
            <IconButton onClick={() => setDarkMode(!darkMode)} color="primary">
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <AccountBalance sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              </motion.div>
              <Typography variant="h3" component="h1" gutterBottom sx={{ 
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Smart Finance Manager
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Take control of your finances with intelligent tracking and beautiful insights
              </Typography>
            </Box>
          </motion.div>
          
          <TransactionForm onTransactionAdded={handleTransactionAdded} />
          <TransactionList transactions={transactions} />
        </Container>

        <Zoom in={showFab}>
          <Fab
            color="primary"
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          >
            <Add />
          </Fab>
        </Zoom>
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export default App;