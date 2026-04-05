import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, FileText, Calendar, Droplets, BedDouble, X, Upload, CheckCircle2 } from "lucide-react";

export default function ClientPortal() {
  const [language, setLanguage] = useState("en");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const translations = {
    en: {
      welcome: "Welcome to ARCHES",
      beds: "Live Bed Availability",
      showers: "Mobile Shower Schedule",
      docs: "Document Locker",
      appointments: "My Appointments",
      available: "Available",
      full: "Full",
      requestBed: "Request a Bed for Tonight",
      reserveShower: "Reserve a Shower Time",
      uploadDoc: "Upload a Document",
      scheduleAppt: "Schedule an Appointment",
      submit: "Submit Request",
      cancel: "Cancel",
      success: "Request submitted successfully!"
    },
    es: {
      welcome: "Bienvenido a ARCHES",
      beds: "Disponibilidad de Camas",
      showers: "Horario de Duchas Móviles",
      docs: "Casillero de Documentos",
      appointments: "Mis Citas",
      available: "Disponible",
      full: "Lleno",
      requestBed: "Solicitar una cama para esta noche",
      reserveShower: "Reservar un horario de ducha",
      uploadDoc: "Subir un documento",
      scheduleAppt: "Programar una cita",
      submit: "Enviar Solicitud",
      cancel: "Cancelar",
      success: "¡Solicitud enviada con éxito!"
    }
  };

  const t = translations[language as keyof typeof translations];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setActiveModal(null);
      }, 2000);
    }, 1000);
  };

  const Modal = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 relative"
      >
        <button 
          onClick={() => setActiveModal(null)}
          className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600"
        >
          <X size={24} />
        </button>
        
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle2 size={32} />
            </motion.div>
            <h3 className="text-xl font-bold text-zinc-900">{t.success}</h3>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 pr-8">{title}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {children}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "..." : t.submit}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 max-w-4xl mx-auto pb-32">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight">{t.welcome}</h1>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-zinc-200">
          <Globe size={18} className="text-zinc-500" />
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-medium cursor-pointer"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveModal('beds')}
          className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 cursor-pointer hover:border-blue-200 transition-colors"
        >
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <BedDouble size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">{t.beds}</h2>
          <div className="flex items-center gap-3 mt-4">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-600">16 {t.available}</span>
          </div>
          <p className="text-sm text-blue-600 font-medium mt-6 flex items-center gap-1">
            {t.requestBed} &rarr;
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveModal('showers')}
          className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 cursor-pointer hover:border-cyan-200 transition-colors"
        >
          <div className="w-14 h-14 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-6">
            <Droplets size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">{t.showers}</h2>
          <p className="text-zinc-500 mt-2">Marion Square Park • 2:00 PM</p>
          <p className="text-sm text-cyan-600 font-medium mt-6 flex items-center gap-1">
            {t.reserveShower} &rarr;
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveModal('docs')}
          className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 cursor-pointer hover:border-purple-200 transition-colors"
        >
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <FileText size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">{t.docs}</h2>
          <p className="text-zinc-500 mt-2">ID, SSN Card, Housing App</p>
          <p className="text-sm text-purple-600 font-medium mt-6 flex items-center gap-1">
            {t.uploadDoc} &rarr;
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveModal('appointments')}
          className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 cursor-pointer hover:border-orange-200 transition-colors"
        >
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
            <Calendar size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">{t.appointments}</h2>
          <p className="text-zinc-500 mt-2">Case Manager • Tomorrow, 10 AM</p>
          <p className="text-sm text-orange-600 font-medium mt-6 flex items-center gap-1">
            {t.scheduleAppt} &rarr;
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeModal === 'beds' && (
          <Modal title={t.requestBed}>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Location Preference</label>
              <select className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3">
                <option>ARCHES Lodge</option>
                <option>Navigation Center</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Special Accommodations</label>
              <textarea className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3" rows={3} placeholder="e.g., Bottom bunk needed, service animal..."></textarea>
            </div>
          </Modal>
        )}

        {activeModal === 'showers' && (
          <Modal title={t.reserveShower}>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Select Time Slot</label>
              <select className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3">
                <option>2:00 PM - 2:20 PM</option>
                <option>2:20 PM - 2:40 PM</option>
                <option>2:40 PM - 3:00 PM</option>
                <option>3:00 PM - 3:20 PM</option>
              </select>
            </div>
            <p className="text-sm text-zinc-500 mt-2">Please arrive 5 minutes before your scheduled time.</p>
          </Modal>
        )}

        {activeModal === 'docs' && (
          <Modal title={t.uploadDoc}>
            <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 text-center bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
              <Upload className="mx-auto text-zinc-400 mb-2" size={32} />
              <p className="text-sm font-medium text-zinc-600">Tap to select a photo or file</p>
              <p className="text-xs text-zinc-400 mt-1">Supports JPG, PNG, PDF</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 mt-4">Document Type</label>
              <select className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3">
                <option>Photo ID</option>
                <option>Social Security Card</option>
                <option>Birth Certificate</option>
                <option>Housing Application</option>
                <option>Other</option>
              </select>
            </div>
          </Modal>
        )}

        {activeModal === 'appointments' && (
          <Modal title={t.scheduleAppt}>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Reason for Visit</label>
              <select className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3">
                <option>Housing Assessment</option>
                <option>Benefits Navigation</option>
                <option>General Case Management</option>
                <option>Mail Pickup</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preferred Date</label>
              <input type="date" className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3" />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
