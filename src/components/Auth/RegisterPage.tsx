import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert, Stack, MenuItem } from '@mui/material';
import axios from 'axios';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/register`, { email, password, role, first_name: firstName, last_name: lastName });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 1, minWidth: 320 }}>
        <Typography variant="h5" mb={1} fontWeight={700}>Register</Typography>
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
            <TextField
              label="First Name"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              fullWidth
              sx={{ mb: 0.25 }}
            />
            <TextField
              label="Last Name"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
              fullWidth
              sx={{ mb: 0.25 }}
            />
            {error && <Alert severity="error" sx={{ mb: 0.25 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 0.25 }}>Registration successful! Redirecting to login...</Alert>}
            <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth sx={{ mt: 0.25, mb: 0.25, minHeight: 32 }}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <Button color="secondary" onClick={() => navigate('/login')} fullWidth sx={{ mt: 0.25, minHeight: 32 }}>
              Back to Login
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default RegisterPage; 