import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { useContext } from 'react';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ScrollToTop from './components/common/ScrollToTop';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import FacilitiesDashboard from './pages/facilities/FacilitiesDashboard';
import UserDirectory from './pages/users/UserDirectory';
import RequestBooking from './pages/bookings/RequestBooking';
import MyBookings from './pages/bookings/MyBookings';
import ApprovalInbox from './pages/bookings/ApprovalInbox';
import BookingCalendar from './pages/bookings/BookingCalendar';
import PolicyAdmin from './pages/bookings/PolicyAdmin';
import RoomDetail from './pages/facilities/RoomDetail';
import ResourcesDashboard from './pages/resources/ResourcesDashboard';
import Settings from './pages/tenant/Settings';

// Public Pages
import PublicLayout from './layouts/PublicLayout';
import LandingPage from './pages/public/LandingPage';
import FeaturesPage from './pages/public/FeaturesPage';
import PricingPage from './pages/public/PricingPage';
import ContactPage from './pages/public/ContactPage';
import AboutPage from './pages/public/AboutPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import SecurityPage from './pages/public/SecurityPage';
import CareersPage from './pages/public/CareersPage';
import BlogPage from './pages/public/BlogPage';
import ApiDocsPage from './pages/public/ApiDocsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-crrfas-bg text-crrfas-cyan">Loading System...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Landing Pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
        </Route>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Standalone Full-Page Routes */}
        <Route path="/signup" element={<Signup />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/facilities" element={<FacilitiesDashboard />} />
          <Route path="/facilities/rooms/:id" element={<RoomDetail />} />
          <Route path="/users" element={<UserDirectory />} />
          <Route path="/request" element={<RequestBooking />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/approvals" element={<ApprovalInbox />} />
          <Route path="/calendar" element={<BookingCalendar />} />
          <Route path="/policies" element={<PolicyAdmin />} />
          <Route path="/resources" element={<ResourcesDashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
