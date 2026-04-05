import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { 
  ShieldAlert, Users, MapPin, BarChart3, ArrowRight, 
  CheckCircle2, Zap, Layout, Heart, Code2, Sparkles,
  ClipboardCheck, Warehouse, Wrench
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-xl tracking-tight">Action<span className="text-blue-600">OS</span></span>
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/router">
                <button className="text-sm font-semibold hover:text-blue-600 transition-colors">Sign In</button>
              </SignInButton>
              <SignInButton mode="modal" forceRedirectUrl="/router">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles size={14} /> Built for MWVCAA / ARCHES
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-[0.9] mb-6">
              The Operational <span className="text-blue-600">Nervous System</span> for Community Action.
            </h1>
            <p className="text-xl text-zinc-500 mb-8 leading-relaxed max-w-lg">
              Stop fighting redundant paperwork. ActionOS centralizes your agency's data, inventory, and compliance into a single, AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/router">
                  <button className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group">
                    Launch ActionOS <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/router" className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group">
                  Enter Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </SignedIn>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square bg-blue-600 rounded-[4rem] rotate-3 absolute inset-0 blur-3xl opacity-10" />
            <div className="relative bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden p-4">
              <div className="bg-zinc-50 rounded-2xl border border-zinc-100 p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Dashboard</div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-2/3 bg-zinc-200 rounded-full animate-pulse" />
                  <div className="h-24 w-full bg-white rounded-2xl border border-zinc-100 flex items-center justify-center">
                    <BarChart3 className="text-blue-600" size={32} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-white rounded-2xl border border-zinc-100" />
                    <div className="h-20 bg-white rounded-2xl border border-zinc-100" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 bg-zinc-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why ActionOS?</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">I've seen the redundancy first-hand. We fill out the same forms for different people, and the information often goes nowhere. ActionOS was built to fix that.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Zero Redundancy",
                desc: "Enter data once. It syncs across Case Management, HMIS, and Admin reports automatically.",
                icon: Layout
              },
              {
                title: "Real-Time Visibility",
                desc: "Directors see live metrics, Case Managers see live resource availability. No more guessing.",
                icon: Zap
              },
              {
                title: "Built for Us",
                desc: "Not a generic software. Custom-tailored for MWVCAA workflows and ARCHES specific needs.",
                icon: CheckCircle2
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <item.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold mb-4 tracking-tight">A Complete Suite of Tools.</h2>
              <p className="text-xl text-zinc-500">Everything you need to run a high-impact agency, from the street to the boardroom.</p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-zinc-100 rounded-xl text-sm font-bold">v1.2.0 Stable</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "AI Grant Drafting", desc: "Generate proposal drafts in seconds using live agency metrics.", icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50" },
              { title: "HMIS Compliance", desc: "HIPAA-compliant data management with encrypted client records.", icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
              { title: "Inventory Tracking", desc: "Live stock levels for food, donations, and facility supplies.", icon: Warehouse, color: "text-blue-600", bg: "bg-blue-50" },
              { title: "Maintenance", desc: "Track work orders and facility health across all locations.", icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
              { title: "SOS Safety", desc: "Instant staff alerts with location tracking for emergency response.", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
              { title: "Multi-Location", desc: "Granular access control for shelters, offices, and mobile units.", icon: MapPin, color: "text-indigo-600", bg: "bg-indigo-50" },
              { title: "Staff Roster", desc: "Real-time shift tracking and HR management for all programs.", icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
              { title: "Custom Analytics", desc: "Beautiful, scannable dashboards for directors and leads.", icon: BarChart3, color: "text-pink-600", bg: "bg-pink-50" },
            ].map((feat, i) => (
              <div key={i} className="group p-6 bg-white border border-zinc-200 rounded-3xl hover:border-blue-300 transition-all hover:shadow-md">
                <div className={`w-10 h-10 ${feat.bg} ${feat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feat.icon size={20} />
                </div>
                <h4 className="font-bold mb-2">{feat.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Ryan Section */}
      <section className="py-24 bg-zinc-900 text-white px-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8 border border-zinc-700">
            <Heart className="text-red-500 fill-red-500" size={32} />
          </div>
          <h2 className="text-4xl font-bold mb-8 tracking-tight italic">"I want to use something better, custom for us, and to be of service."</h2>
          <div className="space-y-6 text-zinc-400 text-lg leading-relaxed mb-12">
            <p>
              As a staff member at MWVCAA, I've seen how much time we lose to redundant paperwork. I built ActionOS to be our agency's custom solution—updated and maintained by me, for us.
            </p>
            <p>
              This isn't just software; it's a commitment to our mission. By automating the mundane, we can spend more time on what matters: helping our community.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-left">
              <p className="font-bold text-white">Ryan Fortin</p>
              <p className="text-sm text-zinc-500">Developer & Staff Member</p>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex gap-3">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><Code2 size={20} /></div>
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><Heart size={20} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">A</div>
            <span className="font-bold text-sm tracking-tight">ActionOS</span>
          </div>
          <p className="text-sm text-zinc-400">© 2026 Built with ❤️ for MWVCAA / ARCHES by Ryan Fortin.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-zinc-400 hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-zinc-400 hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="text-sm text-zinc-400 hover:text-blue-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
