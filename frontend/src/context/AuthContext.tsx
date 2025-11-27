import { createContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface CustomJwtPayload extends JwtPayload {
  email?: string;
  role?: string;
  sub?: string; // user id
}

interface AuthContextType {
  token: string | null;
  user: any | null; // FULL user object from backend
  decoded: CustomJwtPayload | null; // decoded token
  login: (token: string, user: any) => void;
  logout: () => void;
  isAuthReady: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  decoded: null,
  login: () => {},
  logout: () => {},
  isAuthReady: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [decoded, setDecoded] = useState<CustomJwtPayload | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // LOAD FROM LOCALSTORAGE ON PAGE REFRESH
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      try {
        const dec = jwtDecode<CustomJwtPayload>(storedToken);
        const now = Date.now() / 1000;

        if (dec.exp && dec.exp > now) {
          setToken(storedToken);
          setDecoded(dec);
          setUser(storedUser ? JSON.parse(storedUser) : null);

          // Auto logout on expiration
          const expirationTime = dec.exp * 1000 - Date.now();
          setTimeout(() => logout(), expirationTime);
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }

    setIsAuthReady(true);
  }, []);

  const login = (token: string, user: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);

    const dec = jwtDecode<CustomJwtPayload>(token);
    setDecoded(dec);

    // Auto logout when token expires
    if (dec.exp) {
      const expirationTime = dec.exp * 1000 - Date.now();
      setTimeout(() => logout(), expirationTime);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setDecoded(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, decoded, login, logout, isAuthReady }}
    >
      {children}
    </AuthContext.Provider>
  );
};
