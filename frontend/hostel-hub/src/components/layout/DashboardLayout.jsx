import { useState, useEffect } from "react";
import {
    House,
    Building2,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NAVIGATION_MENU } from "../../utils/data";
import ProfileDropdown from "./ProfileDropdown";
import NotificationBell from "./NotificationBell";
import PreferenceControls from "./PreferenceControls";
import { usePreferences } from "../../context/PreferencesContext";
import { ROUTES } from "../../utils/routePaths";

const NavigationItem = ({item, isActive, onClick, isCollapsed}) => {
    const { t } = usePreferences();
    const Icon = item.icon
    return <button
        onClick={() => onClick(item.id)}
        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
            isActive
                ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-50 dark:bg-blue-950/60 dark:text-blue-200 dark:shadow-none"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        }`}
        >
            <Icon 
                className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? "text-blue-600 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"
                }`}
            />
            {!isCollapsed && <span className="ml-3 truncate">{item.labelKey ? t(item.labelKey) : item.name}</span>}
        </button>
}

const DashboardLayout = ({activeMenu, children, mainClassName = ""}) => {

    const {user, logout} = useAuth();
    const { t } = usePreferences();
    const navigate = useNavigate();
    const profileLabel = user?.hostelName || user?.name || "Эзэмшигч";

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNavItem, setActiveNavItem] = useState(activeMenu || 'dashboard');
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    //handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    },[]);

    //close dropdown when clicking outside 
    useEffect(() => {
        const handleClickOutside = () =>{
            if (profileDropdownOpen) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    },[profileDropdownOpen]);

    const handleNavigation = (itemId) => {
        setActiveNavItem(itemId);
        navigate(`/${itemId}`);
        if (isMobile){
            setSidebarOpen(false);
        }
    }

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const sidebarCollapsed = !isMobile && false;
    return (
        <div className ="flex h-screen bg-gray-50 dark:bg-gray-950">
            {/*sidebar */}
            <div className = {`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
                isMobile
                    ? sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    : "translate-x-0"
            } ${
                sidebarCollapsed ? "w-16" : "w-64"
            } bg-white border-r border-gray-200 dark:border-gray-800 dark:bg-gray-900`}
            >
                {/*company logo */}
                <div className= "flex items-center h-16 border-b border-gray-200 pl-6 dark:border-gray-800">
                    {!sidebarCollapsed ? (
                        <Link className="flex items-center space-x-3" to={ROUTES.HOME}>
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                                <House className="h-5 w-5 text-white"/>
                            </div>
                            <span className="text-gray-900 font-bold text-xl dark:text-white">HostelHub</span>
                        </Link>
                    ) : (
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                    )}
                </div>
                {/*navigation  */}
                <nav className="p-4 space-y-2">
                    {NAVIGATION_MENU.map((item)=> (
                        <NavigationItem
                            key={item.id}
                            item={item}
                            isActive={activeNavItem === item.id}
                            onClick={handleNavigation}
                            isCollapsed={sidebarCollapsed}
                        />
                    ))}
                </nav>
                {/*logout */}
                <div className = "absolute bottom-4 left-4 right-4" >
                    <button
                        className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                        onClick={logout}
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"/>
                        {!sidebarCollapsed && <span className="ml-3">{t("logout")}</span>}
                    </button>
                </div>
            </div>
            {/*mobile overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-25 z-40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/*main content */}
            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${
                    isMobile ? "ml-0" :sidebarCollapsed ? "ml-16" : "ml-64"
                }`}
            >
                {/*top navbar */}
                <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30 dark:border-gray-800 dark:bg-gray-950/80">
                    <div className="flex items-center space-x-4">
                        {isMobile && (
                            <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 dark:hover:bg-gray-800"
                            >
                                {sidebarOpen ? (
                                    <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                ) : (
                                    <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                )}
                            </button>
                        )}
                        <div>
                            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                                {t("welcome")}
                            </h1>
                            <p className="text-sm text-gray-500 hidden sm:block dark:text-gray-400">
                                {t("ownerOverview")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <PreferenceControls />
                        <NotificationBell />
                        {/*profile dropdown */}
                        <ProfileDropdown
                            isOpen={profileDropdownOpen}
                            onToggle={(e) => {
                                e.stopPropagation();
                                setProfileDropdownOpen(!profileDropdownOpen);
                            }}
                            avatar={user?.avatar || ""}
                            displayName={profileLabel}
                            email={user?.email || ""}
                            userRole={user?.role || ""}
                            onLogout={logout}
                        />
                    </div>
                </header>
                {/*main content area */}
                <main className={`flex-1 ${mainClassName || "overflow-auto p-6"}`}>{children}</main>
            </div>
        </div>
    )
}

export default DashboardLayout;
