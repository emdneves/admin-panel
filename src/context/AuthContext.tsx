import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: string | null;
  role: string | null;
  token: string | null;
  login: (token: string, role: string, user: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setUser(localStorage.getItem('user'));
    setRole(localStorage.getItem('role'));
    setToken(localStorage.getItem('token'));
  }, []);

  const login = (token: string, role: string, user: string) => {
    setToken(token);
    setRole(role);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('user', user);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 