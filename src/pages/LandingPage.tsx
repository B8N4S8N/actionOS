import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { 
  ShieldAlert, Users, MapPin, BarChart3, ArrowRight, 
  CheckCircle2, Zap, Layout, Sparkles,
  Warehouse, Wrench, Building2, UserCircle,
  Shield, Lock, Database, MessageSquare,
  DollarSign, Settings,
  Award, Target, 
  Play, Quote, Menu, X,
  Cpu, Eye, Fingerprint, 
  Camera, Mic, 
  
  
  
  HandHeart, Home, 
  
  
  FileCheck,
  Navigation,
  Linkedin,
  Github, Twitter, Instagram, Webhook,
  
  
  
  
  
  
  
  
  
  
  
  Plus, 
  
  
  
  
  
  
  
  
  
  
  
  UserCog, 
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  Waves as WavesIcon2, 
  
  
  
  Wind as WindIcon2, 
  
  Snowflake as SnowflakeIcon2, 
  Thermometer as ThermometerIcon2
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

// Custom hook for counting animation
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// Animated counter component
function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const { count, ref } = useCountUp(value);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Feature card component with hover effects
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  color = "blue",
  delay = 0,
  stats,
  badge
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color?: string;
  delay?: number;
  stats?: { label: string; value: string };
  badge?: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", glow: "shadow-blue-500/20" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", glow: "shadow-emerald-500/20" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", glow: "shadow-purple-500/20" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", glow: "shadow-amber-500/20" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", glow: "shadow-rose-500/20" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200", glow: "shadow-cyan-500/20" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", glow: "shadow-orange-500/20" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", glow: "shadow-indigo-500/20" }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group relative p-6 bg-white border border-zinc-200 rounded-2xl hover:border-${color}-300 transition-all duration-300 hover:shadow-xl ${colors.glow} overflow-hidden`}
    >
      {/* Background glow effect */}
      <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
            <Icon size={24} strokeWidth={2} />
          </div>
          {badge && (
            <span className={`px-2 py-1 ${colors.bg} ${colors.text} text-xs font-bold rounded-full`}>
              {badge}
            </span>
          )}
        </div>
        
        <h3 className="font-bold text-lg mb-2 group-hover:text-zinc-900 transition-colors">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed mb-4">{description}</p>
        
        {stats && (
          <div className="pt-4 border-t border-zinc-100">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${colors.text}`}>{stats.value}</span>
              <span className="text-xs text-zinc-400">{stats.label}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Dashboard role card component
function RoleCard({ 
  role, 
  description, 
  features,
  icon: Icon,
  color,
  delay = 0
}: { 
  role: string; 
  description: string; 
  features: string[];
  icon: any;
  color: string;
  delay?: number;
}) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-600 to-blue-400",
    emerald: "from-emerald-600 to-emerald-400",
    purple: "from-purple-600 to-purple-400",
    amber: "from-amber-600 to-amber-400",
    rose: "from-rose-600 to-rose-400",
    cyan: "from-cyan-600 to-cyan-400",
    indigo: "from-indigo-600 to-indigo-400",
    orange: "from-orange-600 to-orange-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="group relative bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:shadow-2xl transition-all duration-500"
    >
      {/* Header gradient */}
      <div className={`h-2 bg-linear-to-r ${colorClasses[color]}`} />

      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
            <Icon size={28} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-bold text-xl text-zinc-900">{role}</h3>
            <p className="text-sm text-zinc-500">{description}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: delay + (i * 0.1) }}
              className="flex items-center gap-2 text-sm text-zinc-600"
            >
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Animated section header
function SectionHeader({ 
  eyebrow, 
  title, 
  description,
  align = "center"
}: { 
  eyebrow?: string; 
  title: string; 
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`mb-16 ${align === "center" ? "text-center" : ""}`}>
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold uppercase tracking-wider mb-6"
        >
          <Sparkles size={16} />
          {eyebrow}
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-4xl lg:text-5xl font-bold tracking-tight mb-6"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className={`text-xl text-zinc-500 leading-relaxed ${align === "center" ? "max-w-3xl mx-auto" : "max-w-2xl"}`}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

// Integration logo component
function IntegrationLogo({ name, category }: { name: string; category: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="group flex flex-col items-center gap-2 p-4"
    >
      <div className="w-16 h-16 bg-white rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 font-bold text-lg group-hover:border-blue-300 group-hover:shadow-md transition-all">
        {initials}
      </div>
      <span className="text-xs text-zinc-500 font-medium">{name}</span>
      <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{category}</span>
    </motion.div>
  );
}

// Testimonial card
function TestimonialCard({ 
  quote, 
  author, 
  role, 
  organization,
  delay = 0
}: { 
  quote: string; 
  author: string; 
  role: string;
  organization: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <Quote size={32} className="text-blue-200 mb-4" />
      <p className="text-lg text-zinc-700 leading-relaxed mb-6 italic">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
          {author.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-bold text-zinc-900">{author}</p>
          <p className="text-sm text-zinc-500">{role}</p>
          <p className="text-xs text-zinc-400">{organization}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Pricing tier component
function PricingTier({ 
  name, 
  price, 
  description, 
  features, 
  cta, 
  popular = false,
  delay = 0
}: { 
  name: string; 
  price: string; 
  description: string; 
  features: string[]; 
  cta: string;
  popular?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative p-8 rounded-3xl border ${popular ? 'border-blue-500 bg-blue-50/50' : 'border-zinc-200 bg-white'} hover:shadow-xl transition-all duration-300`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-bold text-xl mb-2">{name}</h3>
        <p className="text-zinc-500 text-sm">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-zinc-400">/month</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-xl font-bold transition-all ${popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
        {cta}
      </button>
    </motion.div>
  );
}

// FAQ item component
function FAQItem({ question, answer, isOpen, onClick }: { key?: React.Key; question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div 
      className="border-b border-zinc-200 last:border-0"
      initial={false}
    >
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="font-bold text-lg group-hover:text-blue-600 transition-colors">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors"
        >
          <Plus size={20} className={isOpen ? "text-blue-600" : "text-zinc-400"} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-zinc-500 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-blue-100">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-100"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold"
            >
              A
            </motion.div>
            <span className="font-bold text-xl tracking-tight">Action<span className="text-blue-600">OS</span></span>
          </div>
          
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#roles" className="text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors">For Your Role</a>
            <a href="#compliance" className="text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors">Compliance</a>
            <a href="#ai" className="text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors">AI Agents</a>
            <a href="#pricing" className="text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/router">
                <button className="hidden md:block text-sm font-semibold hover:text-blue-600 transition-colors">Sign In</button>
              </SignInButton>
              <SignInButton mode="modal" forceRedirectUrl="/router">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-zinc-100 bg-white"
            >
              <div className="px-6 py-4 space-y-4">
                <a href="#features" className="block text-sm font-medium text-zinc-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#roles" className="block text-sm font-medium text-zinc-600" onClick={() => setMobileMenuOpen(false)}>For Your Role</a>
                <a href="#compliance" className="block text-sm font-medium text-zinc-600" onClick={() => setMobileMenuOpen(false)}>Compliance</a>
                <a href="#ai" className="block text-sm font-medium text-zinc-600" onClick={() => setMobileMenuOpen(false)}>AI Agents</a>
                <a href="#pricing" className="block text-sm font-medium text-zinc-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" 
          />
          <motion.div 
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              rotate: [0, -180, -360]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" 
          />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold uppercase tracking-wider mb-6"
            >
              <Sparkles size={16} className="animate-pulse" />
              The Complete Nonprofit Operating System
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">v2.0</span>
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-[0.9] mb-6">
              One Platform.
              <br />
              <span className="bg-linear-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Infinite Impact.
              </span>
            </h1>
            
            <p className="text-xl text-zinc-500 mb-8 leading-relaxed max-w-xl">
              ActionOS is the first purpose-built operating system for homeless services agencies, shelters, and community action organizations. Unite your staff, streamline compliance, and multiply your impact with AI-powered automation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/router">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
                  >
                    Start Free Trial 
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/router">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
                  >
                    Enter Dashboard 
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </SignedIn>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl font-bold text-lg hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Play size={20} fill="currentColor" />
                Watch Demo
              </motion.button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                HIPAA Ready
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                HUD HMIS Compliant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                SOC 2 Type II
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                99.95% Uptime SLA
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="aspect-square bg-linear-to-br from-blue-600 to-purple-600 rounded-[4rem] rotate-3 absolute inset-0 blur-3xl opacity-20" />
            <div className="relative bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden p-4 hover:shadow-blue-500/20 transition-shadow duration-500">
              <div className="bg-zinc-50 rounded-2xl border border-zinc-100 p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Dashboard</div>
                </div>
                
                {/* Animated dashboard preview */}
                <div className="space-y-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "66%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-4 bg-linear-to-r from-blue-500 to-blue-300 rounded-full" 
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="h-24 bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col justify-between"
                    >
                      <div className="text-xs text-zinc-400 font-bold uppercase">Occupancy</div>
                      <div className="text-2xl font-bold text-blue-600">84<span className="text-sm text-zinc-400">/100</span></div>
                      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "84%" }}
                          transition={{ duration: 1, delay: 0.8 }}
                          className="h-full bg-blue-500 rounded-full" 
                        />
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="h-24 bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col justify-between"
                    >
                      <div className="text-xs text-zinc-400 font-bold uppercase">Active Tasks</div>
                      <div className="text-2xl font-bold text-amber-600">12</div>
                      <div className="flex gap-1">
                        {[1,2,3].map(i => (
                          <motion.div 
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + (i * 0.1) }}
                            className="w-2 h-2 rounded-full bg-amber-500" 
                          />
                        ))}
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="h-24 bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col justify-between"
                    >
                      <div className="text-xs text-zinc-400 font-bold uppercase">AI Actions</div>
                      <div className="text-2xl font-bold text-emerald-600">24</div>
                      <div className="text-xs text-emerald-500">+156% this week</div>
                    </motion.div>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="h-32 bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-blue-600" />
                      <span className="text-xs font-bold text-blue-600 uppercase">AI Shift Briefing</span>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      "Quiet night with 3 late arrivals. Heater in Dorm B flagged for maintenance. Client John D. requesting case worker meeting for ID replacement."
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-5xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-white rounded-3xl border border-zinc-200 shadow-xl"
        >
          {[
            { value: 500, suffix: "+", label: "Nonprofits Served" },
            { value: 50, suffix: "K+", label: "Staff Users" },
            { value: 2, suffix: "M+", label: "Client Records" },
            { value: 99, suffix: "%", label: "Compliance Rate" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 bg-zinc-50 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.03),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader
            eyebrow="The Challenge"
            title="Nonprofit Operations Are Broken"
            description="Staff spend 60% of their time on administrative work instead of helping clients. Fragmented systems, redundant data entry, and compliance nightmares drain your resources."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: "Data Silos",
                desc: "Client info in spreadsheets, bed tracking in paper logs, case notes in separate systems. Your data lives in 10 different places.",
                icon: Database,
                stat: "4.2 hours",
                statLabel: "wasted daily per staff"
              },
              {
                title: "Compliance Nightmares",
                desc: "HUD reports, state audits, funder requirements. Every deadline means pulling all-nighters to compile data from everywhere.",
                icon: FileCheck,
                stat: "72 hours",
                statLabel: "per report manually"
              },
              {
                title: "Disconnected Staff",
                desc: "Float staff don't know bed availability. Case managers can't see inventory. Facilities doesn't know about client needs.",
                icon: Users,
                stat: "3x",
                statLabel: "more miscommunication"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-zinc-500 leading-relaxed mb-6">{item.desc}</p>
                <div className="pt-4 border-t border-zinc-100">
                  <span className="text-3xl font-bold text-rose-600">{item.stat}</span>
                  <span className="text-sm text-zinc-400 ml-2">{item.statLabel}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Solution intro */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-linear-to-br from-blue-600 to-purple-700 rounded-3xl p-12 text-white text-center"
          >
            <h3 className="text-3xl font-bold mb-4">ActionOS Changes Everything</h3>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              One platform that unifies your entire operation. From street outreach to board meetings, every role gets exactly what they need—connected, compliant, and AI-powered.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {["Zero Redundancy", "Real-Time Sync", "AI Automation", "HIPAA Compliant", "99.95% Uptime"].map((tag, i) => (
                <span key={i} className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-medium border border-white/20">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Platform Features"
            title="Everything You Need to Operate at Scale"
            description="ActionOS isn't just software—it's a complete operating system for nonprofit agencies. From client intake to grant writing, every workflow is integrated, automated, and optimized."
          />

          {/* Core platform features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <FeatureCard
              icon={Layout}
              title="12+ Role-Based Dashboards"
              description="Custom dashboards for every position—from Site Assistants to Executive Directors. Each role sees exactly what they need, nothing more."
              color="blue"
              delay={0}
              stats={{ value: "12", label: "specialized dashboards" }}
              badge="Custom Roles"
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise-Grade Security"
              description="HIPAA, SOC 2 Type II, and state privacy law compliant. End-to-end encryption, MFA, audit trails, and field-level access controls."
              color="emerald"
              delay={0.1}
              stats={{ value: "256-bit", label: "AES encryption" }}
              badge="Compliance"
            />
            <FeatureCard
              icon={Sparkles}
              title="AI-Powered Automation"
              description="Autonomous agents handle inventory alerts, grant discovery, shift optimization, and predictive maintenance—always with human oversight."
              color="purple"
              delay={0.2}
              stats={{ value: "40%", label: "time savings" }}
              badge="Agentic AI"
            />
            <FeatureCard
              icon={MapPin}
              title="Multi-Location Management"
              description="Manage shelters, offices, and mobile units from one platform. Location-based permissions and real-time coordination across sites."
              color="amber"
              delay={0.3}
              stats={{ value: "∞", label: "locations supported" }}
              badge="Scalable"
            />
            <FeatureCard
              icon={Building2}
              title="Complete Client Lifecycle"
              description="Intake, case management, bed assignment, exit tracking, and follow-up—all in one place with Coordinated Entry integration."
              color="rose"
              delay={0.4}
              badge="HMIS Ready"
            />
            <FeatureCard
              icon={Warehouse}
              title="Intelligent Inventory"
              description="AI vision counts supplies from photos. Predictive ordering finds best deals. Automatic donor outreach when stock runs low."
              color="cyan"
              delay={0.5}
              badge="AI Powered"
            />
            <FeatureCard
              icon={Wrench}
              title="Smart Maintenance"
              description="Predict equipment failures before they happen. Automated work orders. Vendor management with performance tracking."
              color="orange"
              delay={0.6}
              badge="Preventive"
            />
            <FeatureCard
              icon={ShieldAlert}
              title="Safety & SOS"
              description="One-swipe emergency alerts with GPS. Automatic escalation. Crisis response coordination across all staff locations."
              color="red"
              delay={0.7}
              badge="24/7 Ready"
            />
          </div>

          {/* Feature spotlight - AI Action Button */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-linear-to-br from-zinc-900 to-zinc-800 rounded-3xl p-12 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-bold uppercase tracking-wider mb-6">
                  <Zap size={14} />
                  Revolutionary Interface
                </div>
                <h3 className="text-4xl font-bold mb-6">The AI Action Button</h3>
                <p className="text-xl text-zinc-300 leading-relaxed mb-8">
                  One button. Infinite possibilities. Staff just describe what they see—by voice, photo, or text—and AI routes it to the right system automatically.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Mic, text: "Voice: \"Heater in Dorm B is making noise\" → Maintenance ticket created" },
                    { icon: Camera, text: "Photo: Snap inventory pile → AI counts and updates stock" },
                    { icon: MessageSquare, text: "Text: \"Client John needs case worker\" → Alert sent + note logged" }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="flex items-center gap-3 text-zinc-300"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <item.icon size={18} />
                      </div>
                      {item.text}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Mic size={24} />
                    </div>
                    <div>
                      <div className="font-bold">Listening...</div>
                      <div className="text-sm text-zinc-400">AI Processing</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full bg-linear-to-r from-purple-500 to-blue-500" 
                      />
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [10, 30, 10] }}
                          transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                          className="w-2 bg-purple-400 rounded-full"
                          style={{ height: 10 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role-Based Dashboards Section */}
      <section id="roles" className="py-24 bg-zinc-50 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Built for Every Role"
            title="Custom Dashboards for Your Entire Team"
            description="From the front desk to the boardroom, every staff member gets a purpose-built interface with exactly the tools and data they need. No clutter. No missing features."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RoleCard
              role="Executive Director"
              description="Strategic oversight and organizational health"
              icon={BarChart3}
              color="blue"
              features={[
                "Real-time census across all locations",
                "Financial health dashboards",
                "Grant performance tracking",
                "Compliance scorecards",
                "Board-ready reports",
                "AI-powered insights & anomalies"
              ]}
              delay={0}
            />
            <RoleCard
              role="Program Director"
              description="Multi-site program management"
              icon={Building2}
              color="emerald"
              features={[
                "Cross-location bed management",
                "Staff scheduling & coverage",
                "Waiting list coordination",
                "Outcome metrics by site",
                "Resource allocation tools",
                "Incident tracking across sites"
              ]}
              delay={0.1}
            />
            <RoleCard
              role="Site Coordinator"
              description="Day-to-day operations command center"
              icon={Layout}
              color="purple"
              features={[
                "Visual bed map with live occupancy",
                "Daily schedule & check-ins",
                "Inventory with reorder alerts",
                "Maintenance queue & prioritization",
                "Staff on-duty tracking",
                "AI-generated shift briefings"
              ]}
              delay={0.2}
            />
            <RoleCard
              role="Case Manager"
              description="Client progress & resource coordination"
              icon={UserCircle}
              color="amber"
              features={[
                "Caseload with priority flags",
                "Goal tracking & barrier matrix",
                "AI resource matching",
                "Mobile app for field work",
                "Automated follow-up scheduling",
                "Document & ROI management"
              ]}
              delay={0.3}
            />
            <RoleCard
              role="Site Assistant / Float"
              description="Front-line operations & client care"
              icon={HandHeart}
              color="rose"
              features={[
                "Quick bed check-in/out",
                "Mobile inventory checkout",
                "Maintenance request photos",
                "Case notes with voice-to-text",
                "Float between all facilities",
                "Client requests & alerts"
              ]}
              delay={0.4}
            />
            <RoleCard
              role="Outreach Coordinator"
              description="Mobile services & street engagement"
              icon={Navigation}
              color="cyan"
              features={[
                "GPS location sharing (opt-in)",
                "Mobile unit tracking",
                "Street outreach logging",
                "Client extraction from notes",
                "Resource distribution tracking",
                "Shift coordination with shelters"
              ]}
              delay={0.5}
            />
            <RoleCard
              role="HR Manager"
              description="Talent management & compliance"
              icon={Users}
              color="indigo"
              features={[
                "Staff roster & org chart",
                "Recruiting pipeline",
                "Compliance tracking (TB, background checks)",
                "Training management",
                "Shift coverage alerts",
                "Performance review workflows"
              ]}
              delay={0.6}
            />
            <RoleCard
              role="Finance Director"
              description="Budgets, donations & grant finances"
              icon={DollarSign}
              color="orange"
              features={[
                "Multi-program budget tracking",
                "Donation pipeline & receipts",
                "Grant drawdown monitoring",
                "Expense allocation by funder",
                "Cash flow projections",
                "Automated financial reports"
              ]}
              delay={0.7}
            />
            <RoleCard
              role="Grants Manager"
              description="Funding discovery & compliance"
              icon={Award}
              color="blue"
              features={[
                "Auto-discovered grant opportunities",
                "AI grant writing assistant",
                "Deadline calendar with alerts",
                "Compliance tracking by funder",
                "Outcome alignment tools",
                "Collaboration workspace"
              ]}
              delay={0.8}
            />
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RoleCard
              role="Facilities Manager"
              description="Buildings, equipment & maintenance"
              icon={Wrench}
              color="orange"
              features={[
                "Work order Kanban board",
                "Preventive maintenance calendar",
                "Asset QR tracking",
                "Vendor performance metrics",
                "Safety compliance dashboard",
                "Capital project tracking"
              ]}
              delay={0.9}
            />
            <RoleCard
              role="IT Support"
              description="Systems, security & help desk"
              icon={Settings}
              color="cyan"
              features={[
                "System health monitoring",
                "Security event timeline",
                "User management & access reviews",
                "Help desk ticketing",
                "Integration health checks",
                "Audit log viewer & export"
              ]}
              delay={1.0}
            />
            <RoleCard
              role="Client Portal"
              description="Self-service for clients"
              icon={Home}
              color="emerald"
              features={[
                "Bed status & extension requests",
                "Appointment scheduling",
                "Document upload & tracking",
                "Goal setting & progress",
                "Resource directory",
                "Secure case manager messaging"
              ]}
              delay={1.1}
            />
          </div>
        </div>
      </section>

      {/* Compliance & Security Section */}
      <section id="compliance" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Enterprise Security"
            title="Compliance Built-In, Not Bolted-On"
            description="ActionOS is designed from the ground up for nonprofit compliance requirements. HIPAA, HUD HMIS, SOC 2, and state privacy laws—all handled automatically."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold mb-6">Defense in Depth Security</h3>
              <div className="space-y-6">
                {[
                  {
                    icon: Lock,
                    title: "End-to-End Encryption",
                    desc: "AES-256 for data at rest, TLS 1.3 for data in transit. Field-level encryption for PII/PHI with automatic key rotation."
                  },
                  {
                    icon: Fingerprint,
                    title: "Multi-Factor Authentication",
                    desc: "TOTP authenticator support with SMS backup. Required for all admin and director roles. Biometric options available."
                  },
                  {
                    icon: Eye,
                    title: "Comprehensive Audit Logging",
                    desc: "Every data access logged with user, timestamp, IP, and action. 6-year retention with tamper-proof storage."
                  },
                  {
                    icon: Shield,
                    title: "Role-Based Access Control",
                    desc: "Granular permissions at resource, action, and scope level. Location-based data isolation with cross-location workflows."
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-zinc-500">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900 rounded-3xl p-8 text-white"
            >
              <div className="flex items-center gap-3 mb-8">
                <Shield size={32} className="text-emerald-400" />
                <span className="text-xl font-bold">Compliance Certifications</span>
              </div>
              
              <div className="space-y-4">
                {[
                  { name: "HIPAA Compliant", status: "certified", desc: "Technical & administrative safeguards" },
                  { name: "SOC 2 Type II", status: "certified", desc: "Security, availability & confidentiality" },
                  { name: "HUD HMIS Standards", status: "certified", desc: "Data quality & CoC reporting" },
                  { name: "CCPA / GDPR Ready", status: "ready", desc: "Consumer privacy rights" },
                  { name: "State Privacy Laws", status: "ready", desc: "CDPA, CPA, VCDPA & more" }
                ].map((cert, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div>
                      <div className="font-bold">{cert.name}</div>
                      <div className="text-sm text-zinc-400">{cert.desc}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      cert.status === "certified" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {cert.status === "certified" ? "✓ Certified" : "Ready"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Compliance features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Database,
                title: "Automated Data Retention",
                desc: "7-year retention for client records per HUD requirements. Automatic archival to encrypted storage with search access."
              },
              {
                icon: FileCheck,
                title: "HMIS Reporting Engine",
                desc: "Auto-generate APR, CAPER, and Point-in-Time reports. Data quality scoring with error detection and correction workflows."
              },
              {
                icon: UserCog,
                title: "Access Reviews & Certification",
                desc: "Quarterly access certification workflows. Automated reminders for managers. Revocation for inactive accounts."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-zinc-200"
              >
                <item.icon size={32} className="text-blue-600 mb-4" />
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI & Automation Section */}
      <section id="ai" className="py-24 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm font-bold uppercase tracking-wider mb-6"
            >
              <Cpu size={16} />
              Agentic AI Platform
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-6"
            >
              AI Agents That Actually <span className="text-purple-400">Help</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-zinc-400 max-w-3xl mx-auto"
            >
              Not chatbots. Autonomous agents that handle routine work, surface insights, and coordinate across your entire operation—always with human oversight.
            </motion.p>
          </div>

          {/* AI Agents showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Warehouse,
                title: "Inventory Intelligence",
                color: "cyan",
                desc: "Vision-based counting from photos. Predictive ordering with sale alerts. Automatic donor outreach when stock is low.",
                example: "AI detected low body wash and found a 28% off sale. Recommended stocking up for December flu season."
              },
              {
                icon: Award,
                title: "Grant Scout & Writer",
                color: "amber",
                desc: "Auto-discovers relevant grants from 50+ sources. Drafts applications using your agency's live data and past proposals.",
                example: "Found HUD CoC opportunity with 95% match score. Drafted executive summary using 2025 program metrics."
              },
              {
                icon: Users,
                title: "HR & Scheduling Agent",
                color: "emerald",
                desc: "Optimizes shift coverage, tracks compliance expirations, and screens applicants against position requirements.",
                example: "TB test expiring for 3 staff next week. Auto-scheduled renewal appointments and found coverage."
              },
              {
                icon: BarChart3,
                title: "Risk & Outcome Predictor",
                color: "rose",
                desc: "Identifies clients at risk of returning to homelessness. Surfaces barrier patterns. Recommends interventions.",
                example: "Client missed 2 appointments + no case note in 30 days = 85% return risk. Suggested wellness check."
              },
              {
                icon: FileCheck,
                title: "Compliance Monitor",
                color: "blue",
                desc: "Continuously checks data quality, deadline alerts, and regulatory requirements. Generates reports automatically.",
                example: "HUD APR due in 15 days. Compiled 94% of required data. Flagged 6 records needing case manager review."
              },
              {
                icon: Zap,
                title: "Action Button Processor",
                color: "purple",
                desc: "Routes natural language requests to the right systems. Extracts structured data from voice, photo, and text.",
                example: "\"Heater broken in Dorm B\" → Maintenance ticket + facilities alert + client comfort check scheduled."
              }
            ].map((agent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-${agent.color}-500/20 flex items-center justify-center mb-4`}>
                  <agent.icon size={24} className={`text-${agent.color}-400`} />
                </div>
                <h4 className="font-bold text-lg mb-2">{agent.title}</h4>
                <p className="text-sm text-zinc-400 mb-4">{agent.desc}</p>
                <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-300 italic border-l-2 border-purple-500">
                  "{agent.example}"
                </div>
              </motion.div>
            ))}
          </div>

          {/* Human-in-the-loop highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-linear-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 border border-purple-500/30"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                <Target size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Always Human-in-the-Loop</h3>
                <p className="text-zinc-300 leading-relaxed mb-4">
                  AI agents research, recommend, and draft—but humans make every important decision. No auto-orders without approval. No client outreach without review. No reports submitted without sign-off.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["AI Recommends", "Human Decides", "System Executes", "Audit Logs Everything"].map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Integrations"
            title="Connects With Your Entire Ecosystem"
            description="ActionOS integrates with 50+ tools and services. From accounting to government systems, everything works together."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
            {[
              { name: "Clerk", category: "Auth" },
              { name: "Twilio", category: "SMS" },
              { name: "SendGrid", category: "Email" },
              { name: "Stripe", category: "Payments" },
              { name: "QuickBooks", category: "Accounting" },
              { name: "Google Gemini", category: "AI" },
              { name: "HUD HDX", category: "Compliance" },
              { name: "HMIS", category: "Data" },
              { name: "Slack", category: "Comms" },
              { name: "S3", category: "Storage" },
              { name: "Cloudflare", category: "CDN" },
              { name: "DataDog", category: "Monitoring" }
            ].map((integration, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <IntegrationLogo name={integration.name} category={integration.category} />
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-8 border border-zinc-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Settings size={32} className="text-blue-600" />
                </div>
                <h4 className="font-bold mb-2">Open API</h4>
                <p className="text-sm text-zinc-500">RESTful API with comprehensive documentation. Build custom integrations.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Webhook size={32} className="text-purple-600" />
                </div>
                <h4 className="font-bold mb-2">Webhooks</h4>
                <p className="text-sm text-zinc-500">Real-time event notifications. Connect to Zapier, Make, or custom endpoints.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Database size={32} className="text-emerald-600" />
                </div>
                <h4 className="font-bold mb-2">Data Export</h4>
                <p className="text-sm text-zinc-500">Full data portability. Export to CSV, Excel, or direct database access.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Testimonials"
            title="Loved by Nonprofit Leaders"
            description="See what executive directors, program managers, and front-line staff say about ActionOS."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="ActionOS cut our administrative time by 60%. Staff actually spend time with clients now instead of fighting spreadsheets. The AI action button is revolutionary—our float staff just speak their observations and the system handles the rest."
              author="Sarah Chen"
              role="Executive Director"
              organization="Mid-Valley Community Services"
              delay={0}
            />
            <TestimonialCard
              quote="The grant writing AI found three opportunities we would have missed, and the auto-drafted application using our actual program data saved us weeks of work. We got the HUD CoC renewal submitted two weeks early for the first time ever."
              author="Marcus Williams"
              role="Grants Manager"
              organization="Portland Housing Alliance"
              delay={0.1}
            />
            <TestimonialCard
              quote="As a float staff member, I used to spend an hour every shift just doing paperwork. Now I snap photos of inventory, speak case notes, and the AI routes everything. I actually have time to talk to residents."
              author="Jennifer Martinez"
              role="Lead Float Site Assistant"
              organization="ARCHES Lodge"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-zinc-50 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple, Transparent Pricing"
            description="Choose the plan that fits your organization. All plans include core features, security, and support."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingTier
              name="Starter"
              price="$299"
              description="For small agencies with 1-2 locations"
              features={[
                "Up to 25 staff users",
                "2 locations",
                "Core dashboards",
                "Basic AI features",
                "Email support",
                "Standard integrations"
              ]}
              cta="Start Free Trial"
              delay={0}
            />
            <PricingTier
              name="Professional"
              price="$799"
              description="For growing agencies with 3-10 locations"
              features={[
                "Up to 100 staff users",
                "10 locations",
                "All 12+ dashboards",
                "Full AI agent suite",
                "Priority support",
                "Advanced integrations",
                "Custom fields & workflows",
                "HIPAA compliance tools"
              ]}
              cta="Start Free Trial"
              popular={true}
              delay={0.1}
            />
            <PricingTier
              name="Enterprise"
              price="Custom"
              description="For large networks and statewide systems"
              features={[
                "Unlimited staff users",
                "Unlimited locations",
                "White-label options",
                "Dedicated success manager",
                "24/7 phone support",
                "Custom integrations",
                "SOC 2 audit support",
                "On-premise deployment option"
              ]}
              cta="Contact Sales"
              delay={0.2}
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-zinc-500 mb-4">All plans include:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {["99.95% Uptime SLA", "Daily Backups", "SSL Encryption", "API Access", "Mobile Apps", "Regular Updates"].map((item, i) => (
                <span key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            eyebrow="FAQ"
            title="Frequently Asked Questions"
          />

          <div className="bg-white rounded-3xl border border-zinc-200 p-8">
            {[
              {
                question: "How long does implementation take?",
                answer: "Most agencies are fully operational within 4-6 weeks. We provide data migration assistance, staff training, and dedicated onboarding support. Custom configurations for complex multi-site organizations may take 8-10 weeks."
              },
              {
                question: "Is our data really HIPAA compliant?",
                answer: "Yes. ActionOS implements all HIPAA technical safeguards: AES-256 encryption at rest, TLS 1.3 in transit, unique user IDs, automatic session timeout, comprehensive audit logs, and role-based access controls. We can sign BAAs and provide compliance documentation for your audits."
              },
              {
                question: "Can we customize for our specific workflows?",
                answer: "Absolutely. ActionOS is built for customization. Create custom roles, define your location hierarchy, configure intake forms, set up custom fields, and build workflows that match how your agency actually operates."
              },
              {
                question: "What happens if we want to leave?",
                answer: "Your data is always yours. We provide full data export in standard formats (CSV, JSON, SQL) at any time. No lock-in, no hidden fees, no data held hostage. We even provide migration assistance to help you transition if needed."
              },
              {
                question: "How does the AI protect client privacy?",
                answer: "All AI processing happens within our secure environment. No client data is sent to third-party AI services. We use anonymized data for training and have strict data handling protocols. PII/PHI is automatically redacted from AI training data."
              },
              {
                question: "Do you offer discounts for small nonprofits?",
                answer: "Yes. We have special pricing for agencies with annual budgets under $1M, as well as discounts for multi-year commitments. We also offer grant-funded implementation—our grants team can help you find funding to cover ActionOS costs."
              }
            ].map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === i}
                onClick={() => toggleFAQ(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-linear-to-br from-blue-600 via-purple-600 to-blue-700 text-white overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" 
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-bold mb-6"
          >
            Ready to Transform Your Agency?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
          >
            Join hundreds of nonprofits already using ActionOS to multiply their impact. Start your free 30-day trial today.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/router">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight size={20} />
                </motion.button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/router">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  Enter Dashboard
                  <ArrowRight size={20} />
                </motion.button>
              </Link>
            </SignedIn>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              Schedule Demo
            </motion.button>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-sm text-blue-200"
          >
            No credit card required • Setup assistance included • Cancel anytime
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                <span className="font-bold text-xl tracking-tight">Action<span className="text-blue-400">OS</span></span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                The complete operating system for homeless services agencies, shelters, and community action organizations.
              </p>
              <div className="flex gap-3">
                {[Twitter, Linkedin, Github, Instagram].map((Icon, i) => (
                  <motion.a 
                    key={i}
                    whileHover={{ scale: 1.1, y: -2 }}
                    href="#" 
                    className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                  >
                    <Icon size={18} />
                  </motion.a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                {["Features", "Pricing", "Integrations", "Security", "Changelog", "Roadmap"].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                {["Documentation", "API Reference", "Help Center", "Community", "Webinars", "Case Studies"].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                {["About", "Blog", "Careers", "Press", "Contact", "Partner Program"].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-500">
              © 2026 ActionOS. Built with ❤️ for the nonprofit community.
            </p>
            <div className="flex gap-6 text-sm text-zinc-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

