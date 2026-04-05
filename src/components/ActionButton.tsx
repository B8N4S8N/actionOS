import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Camera, Type, Send, X, Loader2 } from "lucide-react";
import { useAuthSafe } from "../contexts/AuthContext";

export default function ActionButton() {
  const { userId, siteId } = useAuthSafe();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "voice" | "photo" | null>(null);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!input.trim() && mode !== "photo") return;
    
    setIsProcessing(true);
    try {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          site_id: siteId,
          text: input,
          imageBase64: null
        })
      });
      const data = await res.json();
      setResult(data.aiResult);
      setInput("");
      setMode(null);
    } catch (error) {
      console.error(error);
      setResult({ 
        summary: "Error processing action. Please try again.", 
        tasks: [] 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-4 w-80 mb-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-zinc-900">Action Log</h3>
                <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {mode === null ? (
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setMode("text")} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <Type className="w-6 h-6 text-zinc-600" />
                    <span className="text-xs font-medium text-zinc-600">Text</span>
                  </button>
                  <button onClick={() => setMode("voice")} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <Mic className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-medium text-zinc-600">Voice</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <Camera className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-medium text-zinc-600">Photo</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={() => setMode("photo")} />
                </div>
              ) : (
                <div className="space-y-4">
                  {mode === "text" && (
                    <textarea
                      autoFocus
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your shift notes, incidents, or inventory updates..."
                      className="w-full h-32 p-3 rounded-xl border border-zinc-200 bg-zinc-50 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                    />
                  )}
                  {mode === "voice" && (
                    <div className="h-32 flex flex-col items-center justify-center gap-4 bg-zinc-50 rounded-xl border border-zinc-200">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                        <Mic className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-zinc-600">Listening...</span>
                    </div>
                  )}
                  {mode === "photo" && (
                    <div className="h-32 flex flex-col items-center justify-center gap-4 bg-zinc-50 rounded-xl border border-zinc-200">
                      <Camera className="w-8 h-8 text-emerald-600" />
                      <span className="text-sm font-medium text-zinc-600">Photo attached</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <button onClick={() => setMode(null)} className="text-sm font-medium text-zinc-500 hover:text-zinc-700">Back</button>
                    <button 
                      onClick={handleSubmit}
                      disabled={isProcessing || (!input.trim() && mode !== "photo")}
                      className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Process
                    </button>
                  </div>
                </div>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-900"
                >
                  <p className="font-semibold mb-1">AI Summary:</p>
                  <p className="text-emerald-800">{result.summary}</p>
                  {result.tasks?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold text-xs uppercase tracking-wider text-emerald-700">Tasks Created:</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {result.tasks.map((t: any, i: number) => (
                          <li key={i} className="text-xs">{t.description} ({t.assigned_to_role})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 flex items-center justify-center focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </motion.button>
      </div>
    </>
  );
}
