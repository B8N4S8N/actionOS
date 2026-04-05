import { useState, useEffect } from "react";
import { Users, Calendar, ShieldAlert, MapPin, Loader2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useAuthSafe } from "../contexts/AuthContext";

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  role?: string;
  location_id?: string;
}

export default function HRDashboard() {
  const { siteId } = useAuthSafe();
  const [staff, setStaff] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeStaff: 0,
    pendingUsers: 0,
    totalUsers: 0
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setStaff(data.users || []);
          setStats({
            activeStaff: data.users?.filter((u: UserData) => u.status === "Active").length || 0,
            pendingUsers: data.users?.filter((u: UserData) => u.status === "Pending").length || 0,
            totalUsers: data.users?.length || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="HR & Staffing Dashboard"
          subtitle="Manage staff, schedules, and assignments"
          icon={<Users size={16} />}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-500">Active Staff</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-zinc-900">{stats.activeStaff}</p>
                <p className="text-xs text-zinc-500 font-medium mt-2">Across all locations</p>
              </>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-500">Pending Approvals</h3>
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-zinc-900">{stats.pendingUsers}</p>
                <p className="text-xs text-amber-600 font-medium mt-2">Need role assignment</p>
              </>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-500">Total Users</h3>
              <ShieldAlert className="w-5 h-5 text-emerald-500" />
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-zinc-900">{stats.totalUsers}</p>
                <p className="text-xs text-zinc-500 font-medium mt-2">In system</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-semibold text-zinc-900">Staff Directory</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Loading staff directory...</p>
              </div>
            ) : staff.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <p>No staff members found.</p>
              </div>
            ) : (
              staff.map((person) => (
                <div key={person.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-medium">
                      {person.firstName?.charAt(0) || person.email?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900">
                        {person.firstName && person.lastName 
                          ? `${person.firstName} ${person.lastName}`
                          : person.email || "Unknown User"}
                      </h4>
                      <p className="text-xs text-zinc-500">{person.role || "No role assigned"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-xs font-medium inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                        person.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : person.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {person.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {person.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
