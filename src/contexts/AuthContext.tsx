import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'licensee';
  clinicName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  {
    id: 'admin-1',
    name: 'Administrador',
    email: 'admin@byneofolic.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 'clinic-1',
    name: 'Dr. João Silva',
    email: 'joao@clinica1.com',
    password: 'clinica123',
    role: 'licensee',
    clinicName: 'Clínica Capilar SP'
  },
  {
    id: 'clinic-2',
    name: 'Dra. Maria Santos',
    email: 'maria@clinica2.com',
    password: 'clinica123',
    role: 'licensee',
    clinicName: 'Hair Center RJ'
  },
  {
    id: 'clinic-3',
    name: 'Dr. Carlos Oliveira',
    email: 'carlos@clinica3.com',
    password: 'clinica123',
    role: 'licensee',
    clinicName: 'Transplante Capilar BH'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('byneofolic_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('byneofolic_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('byneofolic_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
