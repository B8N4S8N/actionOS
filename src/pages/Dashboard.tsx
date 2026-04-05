import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Activity, AlertCircle, CheckCircle2, Clock, MapPin, MessageSquare, ShieldAlert, Users, Loader2 } from "lucide-react";
import { useAuthSafe } from "../contexts/AuthContext";
import PageHeader from "../components/PageHeader";

export default function Dashboard() {
  const { siteId } = useAuthSafe();
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [occupancy, setOccupancy] = useState({ total: 0, occupied: 0, available: 0 });
  const [briefing, setBriefing] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [logsRes, tasksRes, incidentsRes, occupancyRes] = await Promise.all([
          fetch(`/api/logs?site_id=${siteId}`),
          fetch(`/api/tasks?site_id=${siteId}`),
          fetch(`/api/incidents?site_id=${siteId}`),
          fetch(`/api/occupancy?site_id=${siteId}`)
        ]);
        
        const logsData = await logsRes.json();
        const tasksData = await tasksRes.json();
        const incidentsData = await incidentsRes.json();
        const occupancyData = await occupancyRes.json();
        
        setLogs(logsData.logs || []);
        setTasks(tasksData.tasks || []);
        setIncidents(incidentsData.incidents || []);
        setOccupancy(occupancyData);
        
        // Generate dynamic briefing from actual logs
        generateBriefing(logsData.logs || [], tasksData.tasks || [], incidentsData.incidents || [], occupancyData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const generateBriefing = (logs: any[], tasks: any[], incidents: any[], occupancy: any) => {
    const openTasks = tasks.filter(t => t.status === 'Open');
    const activeIncidents = incidents.filter(i => i.status === 'ACTIVE');
    
    let summary = `Current Status: ${occupancy.occupied}/${occupancy.total} beds occupied. `;
    
    if (openTasks.length > 0) {
      const maintenanceTasks = openTasks.filter(t => t.assigned_to_role === 'Facilities' || t.category === 'Maintenance');
      if (maintenanceTasks.length > 0) {
        summary += `${maintenanceTasks.length} maintenance item${maintenanceTasks.length > 1 ? 's' : ''} pending. `;
      }
    }
    
    if (activeIncidents.length > 0) {
      summary += `${activeIncidents.length} active incident${activeIncidents.length > 1 ? 's' : ''} requiring attention. `;
    }
    
    // Add context from recent logs (last 3)
    const recentLogs = logs.slice(0, 3);
    if (recentLogs.length > 0) {
      const summaries = recentLogs
        .filter(l => l.ai_summary)
        .map(l => l.ai_summary?.toLowerCase());
      
      if (summaries.some(s => s?.includes('late') || s?.includes('arrival'))) {
        summary += 'Recent late arrivals noted. ';
      }
      if (summaries.some(s => s?.includes('request') || s?.includes('meeting'))) {
        summary += 'Client requests pending follow-up. ';
      }
    }
    
    summary += 'Review task list for details.';
    setBriefing(summary);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <PageHeader
        title="ARCHES Lodge"
        subtitle="Site Assistant View"
        icon={<MapPin size={16} />}
        actions={
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium">System Online</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Users size={24} />
            <h3 className="font-semibold">Bed Capacity</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold mb-1">{occupancy.occupied}<span className="text-xl text-zinc-400 font-normal">/{occupancy.total}</span></p>
              <p className={`text-sm font-medium ${occupancy.available > 5 ? 'text-emerald-600' : occupancy.available > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {occupancy.available} {occupancy.available === 1 ? 'bed' : 'beds'} available
              </p>
            </>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-4 text-orange-600">
            <Activity size={24} />
            <h3 className="font-semibold">Active Tasks</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold mb-1">{tasks.filter(t => t.status === 'Open').length}</p>
              <p className="text-sm text-zinc-500">Needs attention</p>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <ShieldAlert size={24} />
            <h3 className="font-semibold">Recent Incidents</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold mb-1">{incidents.filter(i => i.status === 'ACTIVE').length}</p>
              <p className="text-sm text-zinc-500">Active incidents</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Daily Briefing */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-500" />
            AI Shift Briefing
          </h2>
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-zinc-400 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing site data...</span>
              </div>
            ) : (
              <>
                <p className="text-zinc-700 leading-relaxed">
                  <strong className="text-blue-900">Current Shift Summary:</strong> {briefing || "No recent activity to report. All systems operational."}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {tasks.filter(t => t.status === 'Open' && (t.assigned_to_role === 'Facilities' || t.category === 'Maintenance')).length > 0 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Maintenance Needed</span>
                  )}
                  {tasks.filter(t => t.status === 'Open' && t.assigned_to_role === 'Case Manager').length > 0 && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Case Work</span>
                  )}
                  {incidents.filter(i => i.status === 'ACTIVE').length > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Active Incidents</span>
                  )}
                  {occupancy.available < 5 && occupancy.available > 0 && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Low Bed Capacity</span>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Recent Logs */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-zinc-500" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center p-8 text-zinc-500 bg-white rounded-2xl border border-zinc-200">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading activity...
              </div>
            ) : (
              <>
                {logs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex gap-4">
                    <div className="mt-1">
                      {log.ai_summary ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-orange-500" size={20} />}
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">{log.created_at ? format(new Date(log.created_at), 'MMM d, h:mm a') : 'Unknown date'}</p>
                      <p className="text-zinc-800 font-medium mb-2">{log.raw_content || 'No content'}</p>
                      {log.ai_summary && (
                        <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-sm text-zinc-600">
                          <span className="font-semibold text-zinc-900 mr-2">AI:</span>
                          {log.ai_summary}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center p-8 text-zinc-500 bg-white rounded-2xl border border-zinc-200 border-dashed">
                    No recent activity logs.
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
