import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";

interface AuthContextType {
  userId: string;
  siteId: string | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user) {
      setSiteId(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user data from backend (includes role and site assignment)
      const response = await fetch(`/api/auth/user-data?clerk_id=${user.id}`);
      
      if (!response.ok) {
        // User might not be synced yet - this is OK for new users
        if (response.status === 404) {
          console.log("User data not found, using default context");
          setSiteId("loc1"); // Default site
          setRole(null);
          return;
        }
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      setSiteId(data.site_id || "loc1");
      setRole(data.role || null);
    } catch (err) {
      console.error("Failed to fetch user context:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch user data");
      // Set defaults so app doesn't break
      setSiteId("loc1");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClerkLoaded) {
      fetchUserData();
    }
  }, [isClerkLoaded, user?.id]);

  const value: AuthContextType = {
    userId: user?.id || "system",
    siteId: siteId || "loc1",
    role: role,
    isLoading: isLoading || !isClerkLoaded,
    error,
    refreshUserData: fetchUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for components that need auth but can handle undefined gracefully
export function useAuthSafe() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      userId: "system",
      siteId: "loc1",
      role: null,
      isLoading: false,
      error: null,
      refreshUserData: async () => {},
    };
  }
  return context;
}
