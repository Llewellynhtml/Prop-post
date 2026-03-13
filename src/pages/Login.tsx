import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans overflow-hidden">
      {/* Left Panel: Branded Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0B] relative overflow-hidden flex-col justify-between p-16">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-teal/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-dark-teal/10 rounded-full blur-[120px]"></div>
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-brand-teal rounded-2xl flex items-center justify-center font-bold text-2xl shadow-[0_8px_30px_rgba(30,151,171,0.4)]">
              <span className="text-white">G</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">PropPost</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-6xl font-bold text-white tracking-tight leading-tight mb-8">
              The future of <br />
              <span className="text-brand-teal">Real Estate</span> <br />
              marketing is here.
            </h1>
            <p className="text-white/40 text-lg max-w-md leading-relaxed">
              Automate your social presence, generate high-converting branded content, and manage your listings with precision.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">12.4k</span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Active Users</span>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">98%</span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Efficiency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex flex-col items-center mb-12">
            <div className="w-16 h-16 bg-brand-teal rounded-2xl flex items-center justify-center shadow-xl mb-6">
              <span className="text-white font-bold text-3xl">G</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PropPost</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Sign In</h2>
            <p className="text-gray-400 text-sm font-medium">Enter your credentials to access your dashboard</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm"
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal" />
                Remember me
              </label>
              <a href="#" className="text-brand-teal hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#F8FAFC] px-4 text-gray-400 font-bold tracking-widest">Development Access</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEmail('admin@proppost.co.za');
                setPassword('admin123');
              }}
              className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              Use Demo Credentials
            </button>
          </form>

          <p className="text-center mt-12 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            &copy; 2026 GroupTen Properties. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
