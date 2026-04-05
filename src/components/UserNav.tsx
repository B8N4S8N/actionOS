import { UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export default function UserNav() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      <Link 
        to="/router" 
        className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm"
      >
        <LayoutDashboard size={14} className="text-blue-600" />
        Dashboard
      </Link>
      <div className="p-0.5 bg-white rounded-full shadow-sm border border-zinc-200">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}
