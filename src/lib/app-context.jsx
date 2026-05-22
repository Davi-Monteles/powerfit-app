import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const ThemeContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export const useToast = () => useContext(ToastContext);
export const useTheme = () => useContext(ThemeContext);
