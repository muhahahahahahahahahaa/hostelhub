import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routePaths";

const ProfileDropdown = ({
  isOpen,
  onToggle,
  avatar,
  displayName,
  email,
  onLogout,
  userRole,
}) => {
  const navigate = useNavigate();
  const roleLabel = userRole === "renter" ? "Renter" : "Owner";

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
      >
        {avatar ? (
          <img
            src={avatar}
            alt="Avatar"
            className="h-9 w-9 object-cover rounded-xl"
          />
        ) : (
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {displayName?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(
                userRole === "renter"
                  ? ROUTES.RENTER_PROFILE
                  : ROUTES.OWNER_PROFILE,
              )
            }
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Profile
          </button>
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
