import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import InventorySystem from "../components/InventorySystem";
import { 
  BarChart3, FileText, Users, MapPin, Download, Sparkles, 
  Package, Settings, Plus, Trash2, ClipboardList, ShieldCheck,
  Warehouse, Utensils, Gift, Wrench, X, Mic, Map, Activity, Camera
} from "lucide-react";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [clients, setClients] = useState([]);
  const [outreachInteractions, setOutreachInteractions] = useState([]);
  const [outreachNote, setOutreachNote] = useState("");
  const [outreachLocation, setOutreachLocation] = useState("");
  const [isProcessingOutreach, setIsProcessingOutreach] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ email: "", firstName: "", lastName: "", role_id: "case_manager", location_id: "loc1" });
  
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", address: "", type: "Shelter" });

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ 
    firstName: "", 
    lastName: "", 
    animal_info: "", 
    summary: "",
    dob: "",
    gender: "",
    identity: "",
    phone: "",
    email: "",
    medical_issues: "",
    addictions: "",
    medications: "",
    hmis_id: "",
    image_url: "",
    roi_status: "None"
  });
  const [showClientDetails, setShowClientDetails] = useState<any>(null);
  const [clientNotes, setClientNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  const [showLocationRooms, setShowLocationRooms] = useState<any>(null);
  const [locationRooms, setLocationRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ room_number: "", capacity: 1 });

  const [assignRoomData, setAssignRoomData] = useState({ location_id: "", room_id: "" });
  const [assignRoomsList, setAssignRoomsList] = useState([]);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(setUsers);
    fetch("/api/admin/locations").then(r => r.json()).then(setLocations);
    fetch("/api/inventory").then(r => r.json()).then(setInventory);
    fetch("/api/maintenance").then(r => r.json()).then(setMaintenance);
    fetch("/api/clients").then(r => r.json()).then(setClients);
    fetch("/api/outreach").then(r => r.json()).then(setOutreachInteractions);
  }, []);

  useEffect(() => {
    if (showClientDetails) {
      fetch(`/api/clients/${showClientDetails.id}/notes`).then(r => r.json()).then(setClientNotes);
    }
  }, [showClientDetails]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    });
    if (res.ok) {
      setShowAddUser(false);
      fetch("/api/admin/users").then(r => r.json()).then(setUsers);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditUser) return;
    const res = await fetch(`/api/admin/users/${showEditUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_id: showEditUser.role_id,
        location_id: showEditUser.location_id,
        status: showEditUser.status
      })
    });
    if (res.ok) {
      setShowEditUser(null);
      fetch("/api/admin/users").then(r => r.json()).then(setUsers);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLocation)
    });
    if (res.ok) {
      setShowAddLocation(false);
      fetch("/api/admin/locations").then(r => r.json()).then(setLocations);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClient)
    });
    if (res.ok) {
      setShowAddClient(false);
      setNewClient({ 
        firstName: "", lastName: "", animal_info: "", summary: "",
        dob: "", gender: "", identity: "", phone: "", email: "",
        medical_issues: "", addictions: "", medications: "", hmis_id: "", image_url: "", roi_status: "None"
      });
      fetch("/api/clients").then(r => r.json()).then(setClients);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showClientDetails || !newNote) return;
    const res = await fetch(`/api/clients/${showClientDetails.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: newNote, author_id: "system" }) // In a real app, use the logged-in user's ID
    });
    if (res.ok) {
      setNewNote("");
      fetch(`/api/clients/${showClientDetails.id}/notes`).then(r => r.json()).then(setClientNotes);
      fetch("/api/clients").then(r => r.json()).then(setClients); // Refresh summary
    }
  };

  const handleAssignRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showClientDetails || !assignRoomData.room_id) return;
    const res = await fetch(`/api/clients/${showClientDetails.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignRoomData)
    });
    if (res.ok) {
      fetch("/api/clients").then(r => r.json()).then(setClients);
      setShowClientDetails(null);
    }
  };

  const handleLocationChangeForAssign = async (locId: string) => {
    setAssignRoomData({ ...assignRoomData, location_id: locId });
    if (locId) {
      const res = await fetch(`/api/locations/${locId}/rooms`);
      const data = await res.json();
      setAssignRoomsList(data.filter((r: any) => r.status === 'Available'));
    } else {
      setAssignRoomsList([]);
    }
  };

  const handleViewRooms = async (loc: any) => {
    setShowLocationRooms(loc);
    const res = await fetch(`/api/locations/${loc.id}/rooms`);
    const data = await res.json();
    setLocationRooms(data);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLocationRooms) return;
    const res = await fetch(`/api/locations/${showLocationRooms.id}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRoom)
    });
    if (res.ok) {
      setNewRoom({ room_number: "", capacity: 1 });
      const refreshRes = await fetch(`/api/locations/${showLocationRooms.id}/rooms`);
      const data = await refreshRes.json();
      setLocationRooms(data);
    }
  };

  const handleOutreachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outreachNote) return;
    setIsProcessingOutreach(true);
    try {
      const res = await fetch("/api/outreach/ai-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: outreachNote, location_desc: outreachLocation })
      });
      if (res.ok) {
        setOutreachNote("");
        setOutreachLocation("");
        fetch("/api/outreach").then(r => r.json()).then(setOutreachInteractions);
        fetch("/api/clients").then(r => r.json()).then(setClients);
      }
    } finally {
      setIsProcessingOutreach(false);
    }
  };

  const handleDraftGrant = () => {
    setIsDrafting(true);
    setTimeout(() => setIsDrafting(false), 3000);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "clients", label: "Clients", icon: Users },
    { id: "outreach", label: "Outreach", icon: Map },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "hmis", label: "HMIS", icon: ShieldCheck },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Admin & Director Dashboard</h1>
          <p className="text-zinc-500">Granular control over users, locations, and agency resources</p>
        </div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
                <p className="text-sm text-zinc-500 font-medium mb-2 uppercase tracking-wider">Total Clients</p>
                <p className="text-4xl font-bold">1,248</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
                <p className="text-sm text-zinc-500 font-medium mb-2 uppercase tracking-wider">Active Staff</p>
                <p className="text-4xl font-bold">{users.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
                <p className="text-sm text-zinc-500 font-medium mb-2 uppercase tracking-wider">Locations</p>
                <p className="text-4xl font-bold">{locations.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
                <p className="text-sm text-zinc-500 font-medium mb-2 uppercase tracking-wider">Inventory Value</p>
                <p className="text-4xl font-bold text-emerald-600">$42k</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                  <Sparkles className="text-purple-500" size={24} />
                  AI Grant Drafter
                </h2>
                <button 
                  onClick={handleDraftGrant}
                  disabled={isDrafting}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {isDrafting ? "Analyzing Metrics..." : "Generate Proposal Draft"}
                </button>
              </section>
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                  <Download className="text-blue-500" size={24} />
                  Compliance Exports
                </h2>
                <div className="space-y-3">
                  <button className="w-full p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-left flex items-center justify-between">
                    <span className="font-semibold">HMIS Monthly Roster</span>
                    <Download size={20} className="text-zinc-400" />
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">User Management</h2>
              <button 
                onClick={() => setShowAddUser(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Plus size={18} /> Add User
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{user.firstName} {user.lastName}</td>
                      <td className="px-6 py-4 text-zinc-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{user.role_name || "None"}</td>
                      <td className="px-6 py-4 text-zinc-500">{user.location_name || "None"}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => setShowEditUser(user)} className="text-zinc-400 hover:text-blue-600 transition-colors mr-3">
                          <Settings size={18} />
                        </button>
                        <button className="text-zinc-400 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "clients" && (
          <motion.div
            key="clients"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Client Roster</h2>
              <button 
                onClick={() => setShowAddClient(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Plus size={18} /> Add Client
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Room</th>
                    <th className="px-6 py-4">Animals</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {clients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{client.firstName} {client.lastName}</td>
                      <td className="px-6 py-4 text-zinc-500">{client.location_name || "Unassigned"}</td>
                      <td className="px-6 py-4 text-zinc-500">{client.room_number || "N/A"}</td>
                      <td className="px-6 py-4 text-zinc-500">{client.animal_info || "None"}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => setShowClientDetails(client)} className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "outreach" && (
          <motion.div
            key="outreach"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 sticky top-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                    <Mic className="text-blue-500" size={24} />
                    AI Outreach Log
                  </h2>
                  <p className="text-sm text-zinc-500 mb-6">
                    Type or dictate your interaction notes. The AI will automatically extract the client's profile, medical issues, services provided, and log the interaction.
                  </p>
                  <form onSubmit={handleOutreachSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Location (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Under the bridge on 5th St"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm"
                        value={outreachLocation}
                        onChange={e => setOutreachLocation(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Interaction Notes</label>
                      <textarea 
                        required
                        rows={6}
                        placeholder="e.g. Met John Doe, 45, male. Gave him a hygiene kit and a sandwich. He mentioned having severe asthma and is addicted to meth. Needs a new ID."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm"
                        value={outreachNote}
                        onChange={e => setOutreachNote(e.target.value)}
                      ></textarea>
                    </div>
                    <button 
                      type="submit"
                      disabled={isProcessingOutreach || !outreachNote}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingOutreach ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing AI...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Process & Log
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="p-6 border-b border-zinc-100">
                    <h2 className="text-xl font-bold">Recent Interactions</h2>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {outreachInteractions.map((interaction: any) => (
                      <div key={interaction.id} className="p-6 hover:bg-zinc-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg">
                              {interaction.firstName ? `${interaction.firstName} ${interaction.lastName}` : "Unknown Client"}
                            </h3>
                            <p className="text-sm text-zinc-500 flex items-center gap-1">
                              <MapPin size={14} /> {interaction.location_desc || "Unknown Location"}
                            </p>
                          </div>
                          <span className="text-xs text-zinc-400 font-mono">
                            {new Date(interaction.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-zinc-700 text-sm mb-3">{interaction.notes}</p>
                        {interaction.services_provided && (
                          <div className="flex flex-wrap gap-2">
                            {interaction.services_provided.split(",").map((service: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">
                                {service.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {outreachInteractions.length === 0 && (
                      <div className="p-10 text-center text-zinc-500 italic">No recent interactions logged.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "inventory" && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <InventorySystem />
          </motion.div>
        )}

        {activeTab === "maintenance" && (
          <motion.div
            key="maintenance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Maintenance Requests</h2>
              <button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <Plus size={18} /> New Request
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Issue</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {maintenance.map((req: any) => (
                    <tr key={req.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{req.issue_description}</td>
                      <td className="px-6 py-4 text-zinc-500">{req.location_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          req.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          req.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {maintenance.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 italic">No maintenance requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "hmis" && (
          <motion.div
            key="hmis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-3xl">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">HMIS Compliance & HIPAA</h2>
                <p className="text-zinc-500">Secure, encrypted homelessness information management</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-200">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <ClipboardList size={20} className="text-blue-600" />
                  Recent Records
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-zinc-100 text-sm flex justify-between items-center">
                    <span className="font-mono text-zinc-400">#REC-8291</span>
                    <span className="text-zinc-500">Updated 2h ago</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-zinc-100 text-sm flex justify-between items-center">
                    <span className="font-mono text-zinc-400">#REC-8290</span>
                    <span className="text-zinc-500">Updated 5h ago</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-200">
                <h3 className="font-bold mb-4">Security Audit</h3>
                <p className="text-sm text-zinc-600 mb-4">All data access is logged and HIPAA compliant. No PII is stored in plaintext.</p>
                <button className="text-sm font-bold text-blue-600 hover:underline">View Audit Logs</button>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === "locations" && (
          <motion.div
            key="locations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Location Management</h2>
              <button 
                onClick={() => setShowAddLocation(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Plus size={18} /> Add Location
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {locations.map((loc: any) => (
                    <tr key={loc.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{loc.name}</td>
                      <td className="px-6 py-4 text-zinc-500">{loc.type}</td>
                      <td className="px-6 py-4 text-zinc-500">{loc.address || "N/A"}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleViewRooms(loc)} className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors mr-3">
                          Manage Rooms
                        </button>
                        <button className="text-zinc-400 hover:text-blue-600 transition-colors">
                          <Settings size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Rooms Modal */}
      {showLocationRooms && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Manage Rooms</h2>
                <p className="text-zinc-500">{showLocationRooms.name}</p>
              </div>
              <button onClick={() => setShowLocationRooms(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <p className="text-sm text-zinc-500 font-medium mb-1">Total Rooms</p>
                <p className="text-2xl font-bold">{locationRooms.length}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-sm text-emerald-600 font-medium mb-1">Available</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {locationRooms.filter((r: any) => r.status === 'Available').length}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-sm text-blue-600 font-medium mb-1">Occupied</p>
                <p className="text-2xl font-bold text-blue-700">
                  {locationRooms.filter((r: any) => r.status === 'Occupied').length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-3">Add New Room</h3>
                <form onSubmit={handleAddRoom} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Room Number</label>
                    <input 
                      type="text" required
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm"
                      value={newRoom.room_number}
                      onChange={e => setNewRoom({...newRoom, room_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Capacity</label>
                    <input 
                      type="number" required min="1"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm"
                      value={newRoom.capacity}
                      onChange={e => setNewRoom({...newRoom, capacity: parseInt(e.target.value)})}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    Add Room
                  </button>
                </form>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-3">Room Roster</h3>
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Room</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {locationRooms.map((room: any) => (
                        <tr key={room.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium">{room.room_number}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              room.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 
                              room.status === 'Occupied' ? 'bg-blue-100 text-blue-700' : 
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {room.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500">{room.capacity}</td>
                        </tr>
                      ))}
                      {locationRooms.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-zinc-500 italic">No rooms added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Add New Agency Location</h2>
            <form onSubmit={handleAddLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Location Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. ARCHES Lodge"
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newLocation.name}
                  onChange={e => setNewLocation({...newLocation, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                <select 
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newLocation.type}
                  onChange={e => setNewLocation({...newLocation, type: e.target.value})}
                >
                  <option value="Shelter">Shelter</option>
                  <option value="Office">Office</option>
                  <option value="Service Center">Service Center</option>
                  <option value="Mobile">Mobile Unit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Address</label>
                <input 
                  type="text"
                  placeholder="Street Address"
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newLocation.address}
                  onChange={e => setNewLocation({...newLocation, address: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                >
                  Create Location
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Add New Staff Account</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">First Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newUser.firstName}
                    onChange={e => setNewUser({...newUser, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Last Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newUser.lastName}
                    onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email Address</label>
                <input 
                  type="email" required
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Primary Role</label>
                <select 
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newUser.role_id}
                  onChange={e => setNewUser({...newUser, role_id: e.target.value})}
                >
                  <option value="case_manager">Case Manager</option>
                  <option value="director">Director</option>
                  <option value="facilities">Facilities Manager</option>
                  <option value="hr">HR Manager</option>
                  <option value="outreach">Outreach Worker</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Primary Location</label>
                <select 
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newUser.location_id}
                  onChange={e => setNewUser({...newUser, location_id: e.target.value})}
                >
                  {locations.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6">Add New Client</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">First Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.firstName}
                    onChange={e => setNewClient({...newClient, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Last Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.lastName}
                    onChange={e => setNewClient({...newClient, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date of Birth</label>
                  <input 
                    type="date"
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.dob}
                    onChange={e => setNewClient({...newClient, dob: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">HMIS ID</label>
                  <input 
                    type="text"
                    placeholder="e.g. HMIS-12345"
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.hmis_id}
                    onChange={e => setNewClient({...newClient, hmis_id: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Gender</label>
                  <select 
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.gender}
                    onChange={e => setNewClient({...newClient, gender: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Identity/Race</label>
                  <input 
                    type="text"
                    placeholder="e.g. Hispanic, Caucasian, etc."
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.identity}
                    onChange={e => setNewClient({...newClient, identity: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="(555) 555-5555"
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email</label>
                  <input 
                    type="email"
                    placeholder="client@example.com"
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Medical Issues</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Asthma, Diabetes, etc."
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newClient.medical_issues}
                  onChange={e => setNewClient({...newClient, medical_issues: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Addictions</label>
                <input 
                  type="text"
                  placeholder="e.g. Alcohol, Meth, etc."
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newClient.addictions}
                  onChange={e => setNewClient({...newClient, addictions: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Medications</label>
                <input 
                  type="text"
                  placeholder="e.g. Albuterol, Insulin, etc."
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newClient.medications}
                  onChange={e => setNewClient({...newClient, medications: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Animal Info (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. 1 Dog (Max)"
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newClient.animal_info}
                  onChange={e => setNewClient({...newClient, animal_info: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Profile Photo (Optional)</label>
                  <div className="flex items-center gap-2">
                    {newClient.image_url ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-zinc-200">
                        <img src={newClient.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setNewClient({...newClient, image_url: ""})}
                          className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex-1 cursor-pointer bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 border-dashed rounded-xl px-4 py-3 text-sm text-center text-zinc-500 transition-colors flex items-center justify-center gap-2">
                        <Camera size={16} />
                        <span>Take Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewClient({...newClient, image_url: reader.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Digital ROI Status</label>
                  <select 
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newClient.roi_status || "None"}
                    onChange={e => setNewClient({...newClient, roi_status: e.target.value})}
                  >
                    <option value="None">None</option>
                    <option value="Signed">Signed</option>
                    <option value="Refused">Refused</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                >
                  Add Client
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Client Details Modal */}
      {showClientDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 bg-zinc-100 rounded-2xl border border-zinc-200 flex flex-col items-center justify-center text-zinc-400 cursor-pointer hover:bg-zinc-200 transition-colors overflow-hidden">
                  {showClientDetails.image_url ? (
                    <img src={showClientDetails.image_url} alt="Client" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera size={24} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Add Photo</span>
                    </>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    {showClientDetails.firstName} {showClientDetails.lastName}
                    {showClientDetails.roi_status === 'Signed' && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">ROI Active</span>
                    )}
                  </h2>
                  <p className="text-zinc-500">
                    {showClientDetails.location_name ? `${showClientDetails.location_name} - Room ${showClientDetails.room_number}` : "Unassigned"}
                    {showClientDetails.animal_info && ` • ${showClientDetails.animal_info}`}
                  </p>
                  {showClientDetails.tags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {showClientDetails.tags.split(",").map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setShowClientDetails(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 mb-6 space-y-3">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase">Full Profile</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-zinc-500">Phone:</div>
                    <div className="font-medium">{showClientDetails.phone || "N/A"}</div>
                    <div className="text-zinc-500">Gender/Identity:</div>
                    <div className="font-medium">{showClientDetails.gender || "N/A"} {showClientDetails.identity ? `(${showClientDetails.identity})` : ""}</div>
                    <div className="text-zinc-500">Medical:</div>
                    <div className="font-medium text-red-600">{showClientDetails.medical_issues || "None reported"}</div>
                    <div className="text-zinc-500">Addictions:</div>
                    <div className="font-medium text-orange-600">{showClientDetails.addictions || "None reported"}</div>
                    <div className="text-zinc-500">Medications:</div>
                    <div className="font-medium">{showClientDetails.medications || "None"}</div>
                  </div>
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase">Documents & ROI</h3>
                    <button className="text-xs font-bold text-blue-600 hover:underline">Upload Document</button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-zinc-400" />
                      <span className="text-sm font-medium">HMIS ROI</span>
                    </div>
                    {showClientDetails.roi_status === 'Signed' ? (
                      <span className="text-xs font-bold text-emerald-600">Signed</span>
                    ) : (
                      <button className="text-xs font-bold text-blue-600 hover:underline">Sign Digitally</button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-3">Room Assignment</h3>
                <form onSubmit={handleAssignRoom} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
                  <select 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm"
                    value={assignRoomData.location_id}
                    onChange={e => handleLocationChangeForAssign(e.target.value)}
                  >
                    <option value="">Select Location...</option>
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <select 
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm"
                    value={assignRoomData.room_id}
                    onChange={e => setAssignRoomData({...assignRoomData, room_id: e.target.value})}
                    disabled={!assignRoomData.location_id}
                  >
                    <option value="">Select Room...</option>
                    {assignRoomsList.map((r: any) => (
                      <option key={r.id} value={r.id}>Room {r.room_number} (Cap: {r.capacity})</option>
                    ))}
                  </select>
                  <button 
                    type="submit"
                    disabled={!assignRoomData.room_id}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    Assign Room
                  </button>
                </form>

                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-3 mt-6">AI Summary</h3>
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-sm text-purple-900">
                  {showClientDetails.summary ? showClientDetails.summary : "No summary available yet. Add case notes to generate an AI summary."}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-3">Case Notes</h3>
                <form onSubmit={handleAddNote} className="mb-4">
                  <textarea 
                    required
                    rows={3}
                    placeholder="Add a new note..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm mb-2"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                  ></textarea>
                  <button 
                    type="submit"
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    Add Note
                  </button>
                </form>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {clientNotes.map((note: any) => (
                    <div key={note.id} className="bg-white p-3 rounded-xl border border-zinc-200 text-sm">
                      <p className="text-zinc-800 mb-1">{note.note}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(note.created_at).toLocaleDateString()} • {note.firstName} {note.lastName}
                      </p>
                    </div>
                  ))}
                  {clientNotes.length === 0 && (
                    <p className="text-sm text-zinc-500 italic text-center py-4">No notes yet.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Edit Staff Access</h2>
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                <select 
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={showEditUser.status}
                  onChange={e => setShowEditUser({...showEditUser, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Primary Role</label>
                <select 
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={showEditUser.role_id || ""}
                  onChange={e => setShowEditUser({...showEditUser, role_id: e.target.value})}
                >
                  <option value="admin">Super Admin</option>
                  <option value="director">Director</option>
                  <option value="case_manager">Case Manager</option>
                  <option value="facilities">Facilities Manager</option>
                  <option value="hr">HR Manager</option>
                  <option value="outreach">Outreach Worker</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Primary Location</label>
                <select 
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={showEditUser.location_id || ""}
                  onChange={e => setShowEditUser({...showEditUser, location_id: e.target.value})}
                >
                  {locations.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEditUser(null)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
