import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../utils/routePaths";

const ProtectedRoute = ({ requiredRole }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return (
            <Navigate
                to={user?.role === "owner" ? ROUTES.OWNER_DASHBOARD : ROUTES.FIND_HOSTELS}
                replace
            />
        );
    }

    return <Outlet />;
};
export default ProtectedRoute;
