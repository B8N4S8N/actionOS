import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Activity, AlertCircle, CheckCircle2, Clock, MapPin, MessageSquare, ShieldAlert, Users } from "lucide-react";

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    fetch("/api/logs").then(r => r.json()).then(setLogs);
    fetch("/api/tasks").then(r => r.json()).then(setTasks);
    fetch("/api/incidents").then(r => r.json()).then(setIncidents);
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">ARCHES Lodge</h1>
          <p className="text-zinc-500 flex items-center gap-2">
            <MapPin size={16} /> Site Assistant View
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-200 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Users size={24} />
            <h3 className="font-semibold">Bed Capacity</h3>
          </div>
          <p className="text-4xl font-bold mb-1">84<span className="text-xl text-zinc-400 font-normal">/100</span></p>
          <p className="text-sm text-emerald-600 font-medium">16 beds available</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-4 text-orange-600">
            <Activity size={24} />
            <h3 className="font-semibold">Active Tasks</h3>
          </div>
          <p className="text-4xl font-bold mb-1">{tasks.filter(t => t.status === 'Open').length}</p>
          <p className="text-sm text-zinc-500">Needs attention</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <ShieldAlert size={24} />
            <h3 className="font-semibold">Recent Incidents</h3>
          </div>
          <p className="text-4xl font-bold mb-1">{incidents.length}</p>
          <p className="text-sm text-zinc-500">Last 24 hours</p>
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
            <p className="text-zinc-700 leading-relaxed">
              <strong className="text-blue-900">Night Shift Summary:</strong> The night was mostly quiet. We had 3 late arrivals at 11:30 PM. 
              The heater in Dorm B is making a loud noise and needs maintenance. 
              Client John D. requested a meeting with a case worker regarding his ID replacement.
            </p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Maintenance Needed</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Case Work</span>
            </div>
          </div>
        </section>

        {/* Recent Logs */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-zinc-500" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {logs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 flex gap-4">
                <div className="mt-1">
                  {log.ai_summary ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-orange-500" size={20} />}
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">{format(new Date(log.created_at), 'MMM d, h:mm a')}</p>
                  <p className="text-zinc-800 font-medium mb-2">{log.raw_content}</p>
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
          </div>
        </section>
      </div>
    </div>
  );
}
