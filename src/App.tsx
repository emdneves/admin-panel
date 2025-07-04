import React, { useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Dashboard from './components/Layout/Dashboard';
import { IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';

// Theme tokens for light and dark mode
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    primary: {
      main: '#5561f2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ffb300',
    },
    background: {
      default: mode === 'dark' ? '#181a20' : '#FFFAF0',
      paper: mode === 'dark' ? '#23262f' : '#FFFAF0',
    },
    success: {
      main: '#43d39e',
    },
    error: {
      main: '#ff5252',
    },
    text: {
      primary: mode === 'dark' ? '#fff' : '#181a20',
      secondary: mode === 'dark' ? '#b0b3c0' : '#23262f',
    },
  },
  typography: {
    fontFamily: 'Poppins, Roboto, Helvetica, Arial, sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightBold: 700,
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: mode === 'dark' ? 'rgba(35,38,47,0.95)' : 'rgba(255,250,240,0.85)',
          color: mode === 'dark' ? '#fff' : '#222',
          boxShadow: mode === 'dark'
            ? '0 2px 12px 0 rgba(20,20,40,0.18)'
            : '0 2px 12px 0 rgba(80,80,120,0.08)',
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: mode === 'dark'
            ? '0 4px 24px 0 rgba(20,20,40,0.18)'
            : '0 4px 24px 0 rgba(80,80,120,0.10)',
          backgroundColor: mode === 'dark' ? undefined : '#FFFAF0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          padding: '8px 20px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 4,
          borderRadius: 2,
          background: 'linear-gradient(90deg, #5561f2 0%, #43d39e 100%)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '1rem',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 0,
          fontSize: 13,
          '& .MuiDataGrid-row': {},
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'var(--mui-palette-action-hover)',
          },
          '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: 'var(--mui-palette-action-selected)',
            '&:hover': {
              backgroundColor: 'var(--mui-palette-action-selected)',
            },
          },
          '& .MuiDataGrid-cell': {
            fontSize: 13,
            paddingTop: 4,
            paddingBottom: 4,
          },
          '& .MuiDataGrid-columnHeaders': {
            fontWeight: 600,
            backgroundColor: 'var(--mui-palette-background-paper)',
            minHeight: 32,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: 13,
          },
          '& .MuiDataGrid-virtualScroller': {
            minHeight: 32,
          },
        },
      },
    },
  },
});

// Auth utility to check for token
const isAuthenticated = () => !!localStorage.getItem('token');

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1300 }}>
        <IconButton onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} color="inherit" size="large">
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </div>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
