import { useState, useEffect } from "react";
import {
    House,
    Bookmark,
    MessageSquare,
} from "lucide-react";
import { Link, useNavigate} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileDropdown from "./ProfileDropdown";
import NotificationBell from "./NotificationBell";
import PreferenceControls from "./PreferenceControls";
import { usePreferences } from "../../context/PreferencesContext";
import { ROUTES } from "../../utils/routePaths";

const Navbar = () => {

    const { user, logout, isAuthenticated } = useAuth();
    const { t } = usePreferences();
    const navigate = useNavigate();
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const isRenter = user?.role === "renter";
    const profileLabel =
        user?.role === "owner" ? user?.hostelName || user?.name : user?.name;

    //close dropdowns when clicking outside
    useEffect (() => {
        const handleClickOutside = () => {
            if (profileDropdownOpen){
                setProfileDropdownOpen(false)
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside)
    }, [profileDropdownOpen]);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 dark:bg-gray-950/90">
        <div className="container mx-auto px-4 ">
            <div className="flex items-center justify-between h-16">
                {/*logo */}
                <Link to={ROUTES.HOME} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r  from-blue-500 to-blue-600  rounded-lg flex items-center justify-center">
                        <House className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">HostelHub</span>
                </Link>

                {/*Auth Buttons */}
                <div className="flex items-center space-x-3">
                    <PreferenceControls className="hidden sm:flex" />

                    {isAuthenticated ? (
                        <NotificationBell />
                    ) : null}

                    {isAuthenticated ? (
                        <button
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 relative dark:hover:bg-gray-800"
                            onClick={() => navigate(ROUTES.CHATS)}
                            aria-label={t("messages")}
                        >
                            <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-300"/>
                        </button>
                    ) : null}

                    {isRenter && (
                        <button
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 relative dark:hover:bg-gray-800"
                            onClick={() => navigate(ROUTES.SAVED_LISTINGS)}
                            aria-label={t("savedListings")}
                        >
                            <Bookmark className="h-5 w-5 text-gray-500 dark:text-gray-300"/>
                        </button>
                    )}

                    {isAuthenticated ? (
                        <ProfileDropdown
                            isOpen={profileDropdownOpen}
                            onToggle={(e) => {
                                e.stopPropagation();
                                setProfileDropdownOpen(!profileDropdownOpen);
                            }}
                            avatar={user?.avatar || ""}
                            displayName={profileLabel || ""}
                            email={user?.email || ""}
                            userRole={user?.role || ''}
                            onLogout={logout}
                        />
                    ) : (
                        <>
                            <Link
                                to={ROUTES.LOGIN}
                                className="text-gray-600 hover:text-gray-900 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                                {t("login")}
                            </Link>
                            <Link
                                to={ROUTES.SIGNUP}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                {t("signup")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    </header>
  )
}

export default Navbar
