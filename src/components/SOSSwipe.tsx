import { useState } from "react";
import { motion, useDragControls, AnimatePresence } from "motion/react";
import { ShieldAlert, ChevronRight, X, AlertTriangle } from "lucide-react";

export default function SOSSwipe() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const controls = useDragControls();

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 150) {
      setIsTriggered(true);
      // Trigger SOS API
      fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: 1,
          user_id: 1,
          severity_level: "High"
        })
      });
      setTimeout(() => {
        setIsTriggered(false);
        setIsOpen(false);
      }, 5000);
    }
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
            <div className="relative w-72 h-14 bg-zinc-900 rounded-2xl overflow-hidden flex items-center shadow-2xl border border-zinc-800">
              {/* Background Text */}
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-bold text-[10px] tracking-[0.2em] uppercase select-none">
                {isTriggered ? "SOS ACTIVE" : "Swipe to Trigger"}
              </div>

              {/* Draggable Button */}
              <motion.div
                drag="x"
                dragControls={controls}
                dragConstraints={{ left: 0, right: 220 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={{ x: isTriggered ? 220 : 0 }}
                className={`absolute left-1 top-1 bottom-1 w-12 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm z-10 ${
                  isTriggered ? 'bg-red-500' : 'bg-red-600'
                }`}
              >
                {isTriggered ? (
                  <ShieldAlert className="w-5 h-5 text-white" />
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
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
          isOpen ? 'bg-zinc-800 text-zinc-400' : 'bg-red-600 text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <AlertTriangle size={24} />}
      </motion.button>
    </div>
  );
}
