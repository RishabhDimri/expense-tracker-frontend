import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      alert(
        'Unable to sign in: ' +
          (err.response?.data?.message ||
            'Please check your email and password.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-4xl"
      >
        <div className="bg-card border-2 border-border rounded-xl shadow-heavy overflow-hidden grid lg:grid-cols-2">

          {/* Left Panel */}
          <div className="hidden lg:flex bg-primary text-primary-foreground p-10 xl:p-12 flex-col justify-between min-h-[560px]">
            <Link
              to="/"
              className="flex items-center gap-2 w-fit opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="w-9 h-9 rounded-lg border-2 border-primary-foreground/30 flex items-center justify-center font-bold">
                L
              </div>

              <span className="font-bold tracking-tight">
                Ledgerly
              </span>
            </Link>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-60 mb-4">
                Personal Finance
              </p>

              <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
                Your money.
                <br />
                Your plan.
                <br />
                <span className="opacity-60">
                  Your way.
                </span>
              </h1>

              <p className="mt-6 max-w-sm text-sm leading-6 opacity-70">
                Keep track of your spending, budgets and financial goals
                without making money management complicated.
              </p>
            </div>

            <p className="font-mono text-[9px] uppercase tracking-[0.15em] opacity-40">
              Ledgerly Finance · 2026
            </p>
          </div>

          {/* Right Panel */}
          <div className="p-6 sm:p-10 xl:p-12 flex items-center">
            <div className="w-full max-w-md mx-auto">

              {/* Mobile brand */}
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground border-2 border-border shadow-soft flex items-center justify-center font-bold">
                  E
                </div>

                <span className="font-bold text-lg">
                  Ledgerly
                </span>
              </div>

              <div className="mb-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted mb-3">
                  Member Login
                </p>

                <h2 className="text-3xl font-bold tracking-tight">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-muted">
                  Sign in to manage your finances.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-editorial"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        alert('Password recovery is not available yet.')
                      }
                      className="text-[10px] font-bold uppercase tracking-wider text-muted hover:text-primary transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>

                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-editorial"
                    required
                  />
                </div>

                {/* Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full min-h-14 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Register */}
              <div className="mt-7 pt-6 border-t-2 border-border text-center">
                <p className="text-sm text-muted">
                  New to Ledgerly?
                </p>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 mt-2 text-sm font-bold text-primary hover:text-foreground transition-colors"
                >
                  Create an account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between px-2 mt-4 text-[9px] font-mono uppercase tracking-wider text-muted">
          <span>Personal finance</span>
          <span>Secure access</span>
        </div>
      </motion.div>
    </div>
  );
}
