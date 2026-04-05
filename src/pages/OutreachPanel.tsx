import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, Sparkles, MapPin } from "lucide-react";

export default function OutreachPanel() {
  const [outreachInteractions, setOutreachInteractions] = useState([]);
  const [outreachNote, setOutreachNote] = useState("");
  const [outreachLocation, setOutreachLocation] = useState("");
  const [isProcessingOutreach, setIsProcessingOutreach] = useState(false);

  useEffect(() => {
    fetch("/api/outreach").then(r => r.json()).then(setOutreachInteractions);
  }, []);

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
      }
    } finally {
      setIsProcessingOutreach(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 pt-24">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-2">Outreach Log</h1>
        <p className="text-zinc-500">Streamlined interaction logging for street outreach teams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 sticky top-24">
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
    </div>
  );
}
