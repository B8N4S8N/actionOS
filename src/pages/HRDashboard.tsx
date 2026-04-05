import { useState } from "react";
import { Users, Calendar, Clock, ShieldAlert } from "lucide-react";

export default function HRDashboard() {
  const [staff] = useState([
    { id: 1, name: "Sarah Jenkins", role: "Float Lead", status: "On Shift", location: "ARCHES Lodge" },
    { id: 2, name: "Mike Chen", role: "Case Manager", status: "Off Shift", location: "-" },
    { id: 3, name: "Elena Rodriguez", role: "Street Outreach", status: "On Shift", location: "Mobile Unit 2" },
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">HR & Staffing Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage schedules, staff locations, and incidents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-500">Staff On Shift</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-zinc-900">42</p>
            <p className="text-xs text-zinc-500 font-medium mt-2">Across 5 locations</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-500">Open Shifts (Next 48h)</h3>
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-zinc-900">3</p>
            <p className="text-xs text-amber-600 font-medium mt-2">Needs coverage at The Nest</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-500">Staff Incidents (30d)</h3>
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-zinc-900">1</p>
            <p className="text-xs text-zinc-500 font-medium mt-2">Resolved</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-semibold text-zinc-900">Current Staff Roster</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {staff.map(person => (
              <div key={person.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-medium">
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900">{person.name}</h4>
                    <p className="text-xs text-zinc-500">{person.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900">{person.location}</p>
                    <p className={`text-xs font-medium ${person.status === 'On Shift' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {person.status}
                    </p>
                  </div>
                  <button className="p-2 text-zinc-400 hover:text-blue-600 transition-colors">
                    <Clock className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
