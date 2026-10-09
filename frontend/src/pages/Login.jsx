import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DEMO_CREDENTIALS } from '../services/auth';
import { PRODUCT_NAME } from '../config';
import ThemeToggle from '../components/ThemeToggle';
import companyLogo from '../assets/company_logo.webp';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in
  React.useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!email) { setEmailError('Email is required.'); valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email address.'); valid = false; }
    if (!password) { setPasswordError('Password is required.'); valid = false; }
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/5 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-500/5 pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 p-1.5 backdrop-blur-sm border border-white/10 overflow-hidden shrink-0">
            <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-base text-white">{PRODUCT_NAME}</span>
        </div>

        <div className="relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              BESS Fleet Intelligence
            </div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.08] tracking-tight max-w-lg">
              See the fleet.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                Stay ahead.
              </span>
            </h1>
            <p className="text-slate-300/80 text-base mt-6 leading-7 max-w-md">
              Monitor site health, energy flows, and emerging risks across your storage fleet from one clear operational view.
            </p>
          </div>
        </div>

        <p className="text-slate-600 text-xs relative z-10">
          © 2026 Baellchen. All site numbers are illustrative demo data only.
        </p>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with theme toggle */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-12">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 overflow-hidden">
              <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">{PRODUCT_NAME}</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Use the demo credentials below to explore the platform.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Global error */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold" role="alert">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  className={`w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${emailError ? 'border-rose-500 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
                  placeholder="admin@bessmonitor.demo"
                />
                {emailError && <p className="mt-1 text-xs text-rose-500">{emailError}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                    className={`w-full px-4 py-2.5 pr-11 text-sm bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${passwordError ? 'border-rose-500 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="mt-1 text-xs text-rose-500">{passwordError}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Demo Credentials
              </p>
              {DEMO_CREDENTIALS.map((c) => (
                <div key={c.email} className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                  <div><span className="text-slate-400">Email:</span> {c.email}</div>
                  <div><span className="text-slate-400">Pass:</span> {c.password}</div>
                  <div><span className="text-slate-400">Role:</span> {c.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
