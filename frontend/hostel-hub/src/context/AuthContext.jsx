import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { resolveAssetUrl } from "../utils/helper";

const AuthContext = createContext();

const normalizeLeaseTemplates = (userData) => {
    if (Array.isArray(userData?.leaseAgreementTemplates)) {
        return userData.leaseAgreementTemplates
            .map((template) => ({
                ...template,
                name: template?.name ?? "",
                url: resolveAssetUrl(template?.url ?? ""),
                content: template?.content ?? "",
            }))
            .filter((template) => template.name && (template.url || template.content));
    }

    if (userData?.leaseAgreementTemplate && userData?.leaseAgreementTemplateName) {
        return [
            {
                name: userData.leaseAgreementTemplateName,
                url: resolveAssetUrl(userData.leaseAgreementTemplate),
                content: "",
            },
        ];
    }

    return [];
};

const normalizeUser = (userData) => {
    if (!userData) return null;

    const normalizedRole =
        userData.role === "employer"
            ? "owner"
            : userData.role === "jobseeker"
                ? "renter"
                : userData.role;

    return {
        ...userData,
        role: normalizedRole,
        hostelName: userData.hostelName ?? userData.companyName ?? "",
        hostelDescription: userData.hostelDescription ?? userData.companyDescription ?? "",
        avatar: resolveAssetUrl(userData.avatar ?? ""),
        hostelLogo: resolveAssetUrl(userData.hostelLogo ?? userData.companyLogo ?? ""),
        backgroundCheckDocument: resolveAssetUrl(userData.backgroundCheckDocument ?? ""),
        leaseAgreementTemplates: normalizeLeaseTemplates(userData),
    };
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/'
    }, []);

    const checkAuthStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (token && userStr){
                const userData = normalizeUser(JSON.parse(userStr));
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                setIsAuthenticated(true);
            }
        } catch (error){
            console.error('Auth check failed:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(()=>{
        checkAuthStatus();
    }, [checkAuthStatus]);

    const login = (userData, token) => {
        const normalizedUser = normalizeUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));

        setUser(normalizedUser);
        setIsAuthenticated(true);
    };

    const updateUser = (updatedUserData) => {
        const newUserData = normalizeUser({ ...user, ...updatedUserData });
        localStorage.setItem('user', JSON.stringify(newUserData));
        setUser(newUserData);
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        checkAuthStatus,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
