import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    dni?: string;
    companyId?: number | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const res = await fetch(`${apiUrl}/auth/me`, {
                    credentials: 'include' // Important to send the HttpOnly cookie
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data.user) {
                        setUser(data.data.user);
                    }
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMe();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await fetch(`${apiUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error logging out on server:', error);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
