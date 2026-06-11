import { createContext, useState, useEffect, type ReactNode } from 'react';

// Define the shape of the auth context
interface AuthContextProps {
    isAuthenticated: boolean;
    user: any;
    userType: string | null;
    userToken: string | null;
    login: (userData: { data: any; token: string }, type: string) => void;
    logout: () => Promise<void>;
    loading: boolean;
    language: string;
    setLanguage: (lang: string) => void;
}

// Create context (default undefined, will be provided by AuthProviderTrippy)
export const AuthContextTrippy = createContext<AuthContextProps | undefined>(undefined);

export const AuthProviderTrippy = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userType, setUserType] = useState<string | null>(null);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguageState] = useState<string>(() => {
        return localStorage.getItem('language_code') || 'en';
    });

    const setLanguage = (lang: string) => {
        setLanguageState(lang);
        localStorage.setItem('language_code', lang);
        localStorage.setItem('lang', lang);
    };

    // Initialise from localStorage
    useEffect(() => {
        const safeJsonParse = (item: string | null) => {
            try {
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error parsing JSON from localStorage:', e);
                return null;
            }
        };
        const storedUser = safeJsonParse(localStorage.getItem('user'));
        const storedUserType = localStorage.getItem('userType') || 'admin';
        const storedUserToken = localStorage.getItem('userToken') || localStorage.getItem('authToken') || null;
        if (storedUser && storedUserToken) {
            setIsAuthenticated(true);
            setUser(storedUser);
            setUserType(storedUserType);
            setUserToken(storedUserToken);
        }
        setLoading(false);
    }, []);

    const login = (userData: { data: any; token: string }, type: string) => {
        if (!userData || !userData.data || !userData.token) {
            console.error('Invalid user data received during login:', userData);
            return;
        }
        setIsAuthenticated(true);
        setUser(userData.data);
        setUserType(type);
        setUserToken(userData.token);
        localStorage.setItem('user', JSON.stringify(userData.data));
        localStorage.setItem('userType', type);
        localStorage.setItem('userToken', userData.token);
    };

    const logout = async () => {
        try {
            setIsAuthenticated(false);
            setUser(null);
            setUserType(null);
            setUserToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('userType');
            localStorage.removeItem('userToken');
            localStorage.removeItem('authToken');
        } catch (e) {
            console.error('Error logging out:', e);
        }
    };

    return (
        <AuthContextTrippy.Provider
            value={{ isAuthenticated, user, userType, userToken, login, logout, loading, language, setLanguage }}
        >
            {children}
        </AuthContextTrippy.Provider>
    );
};

export default AuthProviderTrippy;
