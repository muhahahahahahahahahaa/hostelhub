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
import RenterAgreementReviewPage from "./pages/Renter/RenterAgreementReviewPage";
import OwnerDashboard from "./pages/Owner/OwnerDashboard";
import ListingForm from "./pages/Owner/ListingForm";
import ManageListings from "./pages/Owner/ManageListings";
import InquiryViewer from "./pages/Owner/InquiryViewer";
import OwnerProfilePage from "./pages/Owner/OwnerProfilePage";
import OwnerListingDetails from "./pages/Owner/OwnerListingDetails";
import OwnerAgreementConfirmPage from "./pages/Owner/OwnerAgreementConfirmPage";
import ViewTemplatePage from "./pages/Owner/ViewTemplatePage";
import NewTemplatePage from "./pages/Owner/NewTemplatePage";
import TemplateClauseSectionsPage from "./pages/Owner/TemplateClauseSectionsPage";
import ChatInbox from "./pages/Shared/ChatInbox";
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

          <Route element={<ProtectedRoute />}>
            <Route path={ROUTES.CHATS} element={<ChatInbox/>}/>
          </Route>

          <Route element={<ProtectedRoute requiredRole="renter" />}>
            <Route path={ROUTES.RENTER_AGREEMENT_REVIEW()} element={<RenterAgreementReviewPage/>} />
          </Route>

          {/*Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="owner"/>}>
            <Route path={ROUTES.OWNER_DASHBOARD} element={<OwnerDashboard/>}/>
            <Route path={ROUTES.OWNER_LISTING_DETAILS()} element={<OwnerListingDetails/>}/>
            <Route path={ROUTES.OWNER_INQUIRY_CONFIRM()} element={<OwnerAgreementConfirmPage/>}/>
            <Route path={ROUTES.POST_LISTING} element={<ListingForm/>}/>
            <Route path={ROUTES.MANAGE_LISTINGS} element={<ManageListings/>}/>
            <Route path={ROUTES.INQUIRIES} element={<InquiryViewer/>}/>
            <Route path={ROUTES.OWNER_PROFILE} element={<OwnerProfilePage/>}/>
            <Route path={ROUTES.OWNER_TEMPLATE_NEW} element={<NewTemplatePage/>}/>
            <Route path={ROUTES.OWNER_TEMPLATE_VIEW()} element={<ViewTemplatePage/>}/>
            <Route path={ROUTES.OWNER_TEMPLATE_CLAUSES()} element={<TemplateClauseSectionsPage/>}/>
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
