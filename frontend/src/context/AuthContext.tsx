import { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';




interface CustomJwtPayload extends JwtPayload {
  name?: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: CustomJwtPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthReady: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthReady: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CustomJwtPayload | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode<CustomJwtPayload>(token);

      const now = Date.now() / 1000; // current time in seconds

      if (decoded.exp && decoded.exp > now) {
        setUser(decoded);
      } else {
        // Token expired
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      setUser(null);
    }
  }
  setIsAuthReady(true);
}, []);


  const login = (token: string) => {
      localStorage.setItem('token', token);
      const decoded = jwtDecode<CustomJwtPayload>(token);
      setUser(decoded);

      if (decoded.exp) {
        const expirationTime = decoded.exp * 1000 - Date.now(); // milliseconds
        setTimeout(() => {
          logout(); // Auto logout when token expires
        }, expirationTime);
      }
};


  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
