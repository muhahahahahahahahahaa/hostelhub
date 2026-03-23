import {motion as Motion} from 'framer-motion';
import { House } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/routePaths';

const Header = () => {
    const {user, isAuthenticated} = useAuth();
    const navigate = useNavigate();
    const dashboardPath = user?.role === "owner" ? ROUTES.OWNER_DASHBOARD : ROUTES.FIND_HOSTELS;

  return (
    <Motion.header
    initial={{opacity:0, y:-20 }}
    animate={{opacity:1, y:0}}
    transition={{duration:0.6}}
    className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
                {/*logo*/}
                <Link to={ROUTES.HOME} className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <House className="w-5 h-5 text-white"/>
                    </div>
                    <span className="text-xl font-bold text-gray-900">HostelHub</span>
                </Link>  
                {/*navigation links - hidden on mobile*/}
                <nav className="hidden md:flex items-center space-x-8">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.FIND_HOSTELS)}
                        className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                    >
                        Browse
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            navigate(
                                isAuthenticated && user?.role === "owner"
                                    ? ROUTES.OWNER_DASHBOARD
                                    : ROUTES.LOGIN,
                            );
                        }}
                        className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                    >
                        Owner Center
                    </button>
                </nav>
                {/*auth buttons*/}
                <div className="flex items-center space-x-3">
                    {isAuthenticated ?(
                        <div className="flex items-center space-x-3">
                            <span className="text-gray-700">
                                Hello, {user?.name}
                            </span>
                            <Link
                                to={dashboardPath}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-sm hover-shadow-md"
                            >
                                Dashboard
                            </Link>
                        </div>
                    ):(
                        <>
                            <Link to={ROUTES.LOGIN} className="text-gray-600 hover:text-gray-900 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
                                Log In
                            </Link>
                            <Link to={ROUTES.SIGNUP} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-sm hover:shadow-md ">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    </Motion.header>
  )
}

export default Header; 
