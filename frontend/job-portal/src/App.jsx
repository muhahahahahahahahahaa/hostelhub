import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {Toaster} from 'react-hot-toast';
import LandingPage from "./pages/LandingPage/LandingPage";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/Signup";
import BrowseListings from "./pages/Renter/BrowseListings";
import ListingDetails from "./pages/Renter/ListingDetails";
import SavedListings from "./pages/Renter/SavedListings";
import RenterProfile from "./pages/Renter/RenterProfile";
import OwnerDashboard from "./pages/Owner/OwnerDashboard";
import ListingForm from "./pages/Owner/ListingForm";
import ManageListings from "./pages/Owner/ManageListings";
import InquiryViewer from "./pages/Owner/InquiryViewer";
import OwnerProfilePage from "./pages/Owner/OwnerProfilePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ROUTES } from "./utils/routePaths";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/*Public Routes*/}
          <Route path={ROUTES.HOME} element={<LandingPage/>} />
          <Route path={ROUTES.SIGNUP} element={<SignUp/>} />
          <Route path={ROUTES.LOGIN} element={<Login/>} />

          <Route path={ROUTES.FIND_HOSTELS} element={<BrowseListings/>}/>
          <Route path={ROUTES.LISTING_DETAILS()} element={<ListingDetails/>}/>
          <Route path={ROUTES.SAVED_LISTINGS} element={<SavedListings/>}/>
          <Route path={ROUTES.RENTER_PROFILE} element={<RenterProfile/>}/>

          {/*Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="owner"/>}>
            <Route path={ROUTES.OWNER_DASHBOARD} element={<OwnerDashboard/>}/>
            <Route path={ROUTES.POST_LISTING} element={<ListingForm/>}/>
            <Route path={ROUTES.MANAGE_LISTINGS} element={<ManageListings/>}/>
            <Route path={ROUTES.INQUIRIES} element={<InquiryViewer/>}/>
            <Route path={ROUTES.OWNER_PROFILE} element={<OwnerProfilePage/>}/>
          </Route>

          {/*Legacy route aliases */}
          <Route path="/find-jobs" element={<Navigate to={ROUTES.FIND_HOSTELS} replace />} />
          <Route path="/job/:jobId" element={<ListingDetails/>} />
          <Route path="/saved-jobs" element={<Navigate to={ROUTES.SAVED_LISTINGS} replace />} />
          <Route path="/employer-dashboard" element={<Navigate to={ROUTES.OWNER_DASHBOARD} replace />} />
          <Route path="/post-job" element={<Navigate to={ROUTES.POST_LISTING} replace />} />
          <Route path="/manage-jobs" element={<Navigate to={ROUTES.MANAGE_LISTINGS} replace />} />
          <Route path="/applicants" element={<Navigate to={ROUTES.INQUIRIES} replace />} />
          <Route path="/company-profile" element={<Navigate to={ROUTES.OWNER_PROFILE} replace />} />


          {/*Catch all route*/}
          <Route path="*" element={<Navigate to ={ROUTES.HOME} replace  />} />
        </Routes>
      </Router>


      <Toaster
        toastOptions={{
          className:"",
          style:{
            fontSize: '13px',
          },
        }}
      />
    </AuthProvider>
  )
}

export default App; 
