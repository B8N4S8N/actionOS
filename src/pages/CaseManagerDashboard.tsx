import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Users, Search, Sparkles, Loader2, MapPin, Calendar } from "lucide-react";

export default function CaseManagerDashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [aiRecommendations, setAiRecommendations] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(setClients);
  }, []);

  const handleGetRecommendations = async (notes: string) => {
    setIsGenerating(true);
    setAiRecommendations("");
    try {
      const res = await fetch("/api/ai/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseNotes: notes })
      });
      const data = await res.json();
      setAiRecommendations(data.recommendations);
    } catch (error) {
      console.error("Failed to get recommendations", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Case Manager Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Client Management & AI Resource Matching</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-zinc-700">My Caseload: 24</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setAiRecommendations("");
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-colors ${
                    selectedClient?.id === client.id ? "bg-blue-50 border border-blue-200" : "hover:bg-zinc-50 border border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-zinc-900">{client.firstName} {client.lastName}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      client.roi_status === 'Signed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {client.roi_status === 'Signed' ? 'ROI Active' : 'No ROI'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> HMIS: {client.hmis_id || "N/A"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Client Details & AI Agent */}
          <div className="lg:col-span-2 space-y-6">
            {selectedClient ? (
              <>
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-zinc-900">{selectedClient.firstName} {selectedClient.lastName}</h2>
                      <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" /> {selectedClient.location_name ? `${selectedClient.location_name} - Room ${selectedClient.room_number}` : "Unassigned Location"}
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors">
                      Edit Profile
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-500" />
                      Current Profile & Notes
                    </h3>
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-sm text-zinc-700 leading-relaxed mb-4">
                      <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                        <div className="text-zinc-500">Phone:</div>
                        <div className="font-medium">{selectedClient.phone || "N/A"}</div>
                        <div className="text-zinc-500">Medical:</div>
                        <div className="font-medium text-red-600">{selectedClient.medical_issues || "None reported"}</div>
                        <div className="text-zinc-500">Addictions:</div>
                        <div className="font-medium text-orange-600">{selectedClient.addictions || "None reported"}</div>
                        <div className="text-zinc-500">Medications:</div>
                        <div className="font-medium">{selectedClient.medications || "None"}</div>
                      </div>
                      <div className="border-t border-zinc-200 pt-4">
                        <h4 className="font-bold text-zinc-900 mb-2">Summary</h4>
                        {selectedClient.summary || "No summary available."}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGetRecommendations(selectedClient.summary || "")}
                    disabled={isGenerating || !selectedClient.summary}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    {isGenerating ? "Agent Analyzing Notes..." : "Find Best Resources via AI Agent"}
                  </button>
                </div>

                {/* AI Recommendations Output */}
                {aiRecommendations && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-50 rounded-2xl border border-purple-200 shadow-sm p-6"
                  >
                    <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      AI Resource Recommendations
                    </h3>
                    <div className="prose prose-sm prose-purple max-w-none text-purple-800 whitespace-pre-wrap">
                      {aiRecommendations}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="h-[600px] bg-white rounded-2xl border border-zinc-200 border-dashed flex flex-col items-center justify-center text-zinc-500">
                <Users className="w-12 h-12 mb-4 text-zinc-300" />
                <p>Select a client to view details and access the AI Agent</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
