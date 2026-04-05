import { useState } from "react";
import { motion, useDragControls, AnimatePresence } from "motion/react";
import { ShieldAlert, ChevronRight, X, AlertTriangle, Loader2 } from "lucide-react";
import { useAuthSafe } from "../contexts/AuthContext";

export default function SOSSwipe() {
  const { userId, siteId } = useAuthSafe();
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const controls = useDragControls();

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 150) {
      // Show confirmation before triggering
      setShowConfirm(true);
    }
  };

  const handleConfirmSOS = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          user_id: userId,
          severity_level: "HIGH",
          location_description: "Triggered via SOS button"
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger SOS: ${response.status}`);
      }

      setIsTriggered(true);
      setSuccess(true);
      setShowConfirm(false);
      
      // Auto-reset after 5 seconds
      setTimeout(() => {
        setIsTriggered(false);
        setSuccess(false);
        setIsOpen(false);
      }, 5000);
    } catch (err) {
      console.error("SOS trigger failed:", err);
      setError(err instanceof Error ? err.message : "Failed to trigger SOS");
      setShowConfirm(false);
      // Reset the slider position
      setIsTriggered(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setError(null);
    // Reset the slider position
    setIsTriggered(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-2"
          >
            {/* Confirmation Dialog */}
            <AnimatePresence>
              {showConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-red-200 p-4 z-50"
                >
                  <div className="flex items-center gap-3 mb-3 text-red-600">
                    <ShieldAlert className="w-6 h-6" />
                    <h3 className="font-bold">Confirm SOS Alert</h3>
                  </div>
                  <p className="text-sm text-zinc-600 mb-4">
                    This will immediately alert all staff and management. Only proceed if there is a genuine emergency.
                  </p>
                  {error && (
                    <div className="bg-red-50 text-red-700 text-sm p-2 rounded-lg mb-3">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmSOS}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Confirm SOS"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-20 right-0 w-72 bg-emerald-50 rounded-2xl shadow-xl border border-emerald-200 p-4 z-50"
                >
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-semibold">SOS Alert Sent</span>
                  </div>
                  <p className="text-sm text-emerald-600 mt-1">
                    Staff and management have been notified.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative w-72 h-14 bg-zinc-900 rounded-2xl overflow-hidden flex items-center shadow-2xl border border-zinc-800">
              {/* Background Text */}
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-bold text-[10px] tracking-[0.2em] uppercase select-none">
                {isTriggered ? "SOS ACTIVE" : showConfirm ? "CONFIRM ABOVE" : "Swipe to Trigger"}
              </div>

              {/* Draggable Button */}
              <motion.div
                drag="x"
                dragControls={controls}
                dragConstraints={{ left: 0, right: 220 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={{ x: isTriggered ? 220 : showConfirm ? 0 : 0 }}
                className={`absolute left-1 top-1 bottom-1 w-12 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm z-10 ${
                  isTriggered ? 'bg-red-500' : showConfirm ? 'bg-zinc-600' : 'bg-red-600'
                }`}
              >
                {isTriggered ? (
                  <ShieldAlert className="w-5 h-5 text-white" />
                ) : showConfirm ? (
                  <ChevronRight className="w-6 h-6 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-6 h-6 text-white" />
                )}
              </motion.div>
              
              {/* Progress Fill */}
              <motion.div 
                className="absolute left-0 top-0 bottom-0 bg-red-500/20 z-0"
                style={{ width: isTriggered ? '100%' : '0%' }}
                animate={{ width: isTriggered ? '100%' : '0%' }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) {
            // Reset state when closing
            setShowConfirm(false);
            setError(null);
            setIsTriggered(false);
            setSuccess(false);
          }
        }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
          isOpen ? 'bg-zinc-800 text-zinc-400' : 'bg-red-600 text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <AlertTriangle size={24} />}
      </motion.button>
    </div>
  );
}
