import React, { useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Dashboard from './components/Layout/Dashboard';
import { IconButton } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import UsersPage from './components/Users/UsersPage';
import ActivityLogPage from './components/ActivityLog/ActivityLogPage';

// Theme tokens for light and dark mode
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#fff' : '#181818',
      contrastText: '#fff',
    },
    secondary: {
      main: '#888',
    },
    background: {
      default: mode === 'dark' ? '#101010' : '#f5f5f5', // main app background
      paper: mode === 'dark' ? '#181818' : '#fff',      // cards, tables, etc.
    },
    success: {
      main: '#43d39e',
    },
    error: {
      main: '#ff5252',
    },
    text: {
      primary: mode === 'dark' ? '#fff' : '#181818',
      secondary: mode === 'dark' ? '#aaa' : '#23262f',
    },
    divider: mode === 'dark' ? '#222' : '#e0e0e0',
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
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: mode === 'dark' ? '#181818' : '#fff',
          color: mode === 'dark' ? '#fff' : '#181818',
          boxShadow: 'none',
          borderBottom: mode === 'dark' ? '1px solid #222' : '1px solid #e0e0e0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
          backgroundColor: mode === 'dark' ? '#181818' : '#fff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          padding: '8px 20px',
          color: 'inherit',
          // Use palette tokens for background and text
          backgroundColor: mode === 'dark' ? '#181818' : '#fff', // fallback for outlined/text
          transition: 'all 0.2s',
        },
        contained: {
          backgroundColor: mode === 'dark' ? '#222' : '#181818',
          color: mode === 'dark' ? '#fff' : '#fff',
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.15)',
          '&:hover': {
            backgroundColor: mode === 'dark' ? '#333' : '#23262f',
            color: mode === 'dark' ? '#fff' : '#fff',
            boxShadow: '0 4px 16px 0 rgba(0,0,0,0.25)',
          },
        },
        outlined: {
          border: `1px solid ${mode === 'dark' ? '#333' : '#e0e0e0'}`,
          color: mode === 'dark' ? '#e0e0e0' : '#181818',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: mode === 'dark' ? '#23262f' : '#f5f5f5',
            color: mode === 'dark' ? '#fff' : '#181818',
          },
        },
        text: {
          color: mode === 'dark' ? '#e0e0e0' : '#181818',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: mode === 'dark' ? '#23262f' : '#f5f5f5',
            color: mode === 'dark' ? '#fff' : '#181818',
          },
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
          backgroundColor: mode === 'dark' ? '#181818' : '#fff',
          color: mode === 'dark' ? '#fff' : '#181818',
          border: 'none',
          borderRadius: 0,
          fontSize: 13,
        },
        columnHeaders: {
          backgroundColor: mode === 'dark' ? '#111' : '#f5f5f5',
          color: mode === 'dark' ? '#fff' : '#181818',
          borderBottom: mode === 'dark' ? '1px solid #222' : '1px solid #e0e0e0',
        },
        cell: {
          backgroundColor: mode === 'dark' ? '#181818' : '#fff',
          color: mode === 'dark' ? '#fff' : '#181818',
          borderBottom: mode === 'dark' ? '1px solid #222' : '1px solid #e0e0e0',
        },
        row: {
          backgroundColor: mode === 'dark' ? '#181818' : '#fff',
        },
        footerContainer: {
          backgroundColor: mode === 'dark' ? '#181818' : '#fff',
          color: mode === 'dark' ? '#fff' : '#181818',
          borderTop: mode === 'dark' ? '1px solid #222' : '1px solid #e0e0e0',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#181818' : '#fff',
          color: mode === 'dark' ? '#fff' : '#181818',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
          backgroundColor: mode === 'dark' ? '#232323' : '#fff',
          minWidth: 180,
          padding: '4px 0',
          fontSize: 13,
        },
        list: {
          padding: 0,
          fontSize: 13,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 16,
          backgroundColor: mode === 'dark' ? '#232323' : '#fff',
          padding: '10px 16px',
          minHeight: 40,
          fontWeight: 500,
          fontSize: 13,
        },
        icon: {
          color: mode === 'dark' ? '#fff' : '#181818',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          minHeight: 40,
          fontWeight: 500,
          fontSize: 13,
          '&:hover': {
            backgroundColor: mode === 'dark' ? '#333' : '#f5f5f5',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#181818' : '#fff',
          color: mode === 'dark' ? '#fff' : '#181818',
        },
        input: {
          color: mode === 'dark' ? '#fff' : '#181818',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#222' : '#eee',
          color: mode === 'dark' ? '#fff' : '#181818',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: mode === 'dark' ? '#222' : '#e0e0e0',
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

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/users" element={
                <RequireAuth>
                  <RequireAdmin>
                    <UsersPage mode={mode} setMode={setMode} />
                  </RequireAdmin>
                </RequireAuth>
              } />
              <Route path="/activity-log" element={
                <RequireAuth>
                  <RequireAdmin>
                    <ActivityLogPage mode={mode} setMode={setMode} />
                  </RequireAdmin>
                </RequireAuth>
              } />
              <Route path="/*" element={
                <RequireAuth>
                  <Dashboard mode={mode} setMode={setMode} />
                </RequireAuth>
              } />
            </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
