import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert, Stack } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/login`, { email, password });
      if (res.data && res.data.token) {
        login(res.data.token, res.data.role, email);
        navigate('/');
      } else {
        setError('Invalid response from server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 1, minWidth: 320 }}>
        <Typography variant="h5" mb={1} fontWeight={700}>Admin Login</Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={1}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              sx={{ mb: 0.25 }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              sx={{ mb: 0.25 }}
            />
            {error && <Alert severity="error" sx={{ mb: 0.25 }}>{error}</Alert>}
            <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth sx={{ mt: 0.25, mb: 0.25, minHeight: 32 }}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Button color="secondary" onClick={() => navigate('/register')} fullWidth sx={{ mt: 0.25, minHeight: 32 }}>
              Register
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage; 