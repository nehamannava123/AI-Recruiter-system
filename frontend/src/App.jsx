import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidatePortal from "./pages/CandidatePortal";
import JobApply from "./pages/JobApply";
import CandidateApplications from "./pages/CandidateApplications";
import ScreeningTest from "./pages/ScreeningTest";
import AIInterview from "./pages/AIInterview";
import RecruiterPortal from "./pages/RecruiterPortal";
import JobDashboard from "./pages/JobDashboard";

function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "recruiter" ? "/recruiter" : "/candidate"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Home />} />

      <Route
        path="/candidate"
        element={
          <ProtectedRoute role="candidate">
            <CandidatePortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/jobs/:jobId"
        element={
          <ProtectedRoute role="candidate">
            <JobApply />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/applications"
        element={
          <ProtectedRoute role="candidate">
            <CandidateApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/screening/:applicationId"
        element={
          <ProtectedRoute role="candidate">
            <ScreeningTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/interview/:applicationId"
        element={
          <ProtectedRoute role="candidate">
            <AIInterview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recruiter"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/jobs/:jobId"
        element={
          <ProtectedRoute role="recruiter">
            <JobDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
