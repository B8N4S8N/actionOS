import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-react";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ClientPortal from "./pages/ClientPortal";
import AdminPanel from "./pages/AdminPanel";
import CaseManagerDashboard from "./pages/CaseManagerDashboard";
import HRDashboard from "./pages/HRDashboard";
import OutreachPanel from "./pages/OutreachPanel";
import RoleRouter from "./components/RoleRouter";
import ActionButton from "./components/ActionButton";
import SOSSwipe from "./components/SOSSwipe";
import UserNav from "./components/UserNav";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-200">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in/*" element={<div className="min-h-screen flex items-center justify-center"><SignIn routing="path" path="/sign-in" forceRedirectUrl="/router" /></div>} />
          
          {/* Protected Routes */}
          <Route path="/router" element={<RoleRouter />} />
          <Route path="/dashboard" element={
            <SignedIn><Dashboard /></SignedIn>
          } />
          <Route path="/client" element={
            <SignedIn><ClientPortal /></SignedIn>
          } />
          <Route path="/admin" element={
            <SignedIn><AdminPanel /></SignedIn>
          } />
          <Route path="/case-manager" element={
            <SignedIn><CaseManagerDashboard /></SignedIn>
          } />
          <Route path="/hr" element={
            <SignedIn><HRDashboard /></SignedIn>
          } />
          <Route path="/outreach" element={
            <SignedIn><OutreachPanel /></SignedIn>
          } />
        </Routes>

        <SignedIn>
          <SOSSwipe />
          <UserNav />
          <ActionButton />
        </SignedIn>
      </div>
    </BrowserRouter>
  );
}

