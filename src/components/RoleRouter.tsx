import { useEffect, useState, useRef } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function RoleRouter() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken, sessionId } = useAuth();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !sessionId) {
      if (isLoaded && !isSignedIn) {
        navigate("/");
      }
      return;
    }

    if (!user) return;

    if (syncAttempted.current) return;

    const syncUser = async () => {
      try {
        syncAttempted.current = true;
        setIsSyncing(true);
        setError(null);
        
        // Add a timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        // Wrap getToken in a timeout promise to prevent hanging
        const tokenPromise = getToken();
        const tokenTimeoutPromise = new Promise<string | null>((_, reject) => {
          setTimeout(() => reject(new Error("Token request timed out")), 8000);
        });
        
        const token = await Promise.race([tokenPromise, tokenTimeoutPromise]);

        if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
          console.error("Missing user data from Clerk");
          setError("Missing user email address. Please ensure your account has an email.");
          setIsSyncing(false);
          return;
        }

        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            id: user.id,
            email: user.primaryEmailAddress.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const dbUser = await res.json();
          console.log("Sync successful, user data:", dbUser);
          const roles = dbUser.access?.map((a: any) => a.role_id) || [];
          console.log("User roles:", roles);
          
          if (roles.includes("admin") || roles.includes("director")) {
            console.log("Navigating to /admin");
            navigate("/admin");
          } else if (roles.includes("case_manager")) {
            console.log("Navigating to /case-manager");
            navigate("/case-manager");
          } else if (roles.includes("hr")) {
            console.log("Navigating to /hr");
            navigate("/hr");
          } else if (roles.includes("outreach")) {
            console.log("Navigating to /outreach");
            navigate("/outreach");
          } else if (roles.includes("facilities")) {
            console.log("Navigating to /dashboard");
            navigate("/dashboard");
          } else {
            console.log("Navigating to /client");
            navigate("/client");
          }
        } else {
          const errText = await res.text();
          let errData = { error: errText };
          try { errData = JSON.parse(errText); } catch (e) {}
          console.error("Sync failed:", res.status, errData);
          setError(`Server Error (${res.status}): ${errData.error || errText || "Failed to synchronize account."}`);
        }
      } catch (error: any) {
        console.error("Error syncing user:", error);
        setError(`Connection Error: ${error.message || "Please try again."}`);
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, navigate, getToken, sessionId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Routing Error</h2>
          <p className="text-zinc-500 mb-8">{error}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
            >
              Retry Authentication
            </button>
            <button 
              onClick={() => navigate("/")}
              className="w-full py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-zinc-500 font-medium tracking-tight">Authenticating & Routing...</p>
        <p className="text-xs text-zinc-400">This usually takes a few seconds</p>
      </div>
    </div>
  );
}
