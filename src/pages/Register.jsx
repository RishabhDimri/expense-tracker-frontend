import { useState } from 'react';
import { authService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, User, Mail, Lock, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.register(formData);
      alert('Account created successfully!');
      navigate('/login');
    } catch (err) {
      alert(
        'Registration failed: ' +
          (err.response?.data?.message || 'Something went wrong')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8 sm:px-6 relative overflow-hidden">

      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-mesh" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="
          relative z-10
          w-full max-w-4xl
          grid lg:grid-cols-[0.9fr_1.1fr]
          bg-card
          border-2 border-border
          rounded-2xl
          overflow-hidden
          shadow-heavy
        "
      >

        {/* =====================================================
            LEFT PANEL
        ===================================================== */}

        <div
          className="
            hidden lg:flex
            relative
            bg-primary
            text-primary-foreground
            p-10
            flex-col
            justify-between
            min-h-[620px]
            overflow-hidden
          "
        >
          {/* Decorative blocks */}
          <div className="absolute -right-16 -top-16 w-48 h-48 border-2 border-primary-foreground/10 rounded-full" />
          <div className="absolute -right-8 -top-8 w-48 h-48 border-2 border-primary-foreground/10 rounded-full" />

          <div className="relative z-10">
            <Link
              to="/"
              className="
                inline-flex items-center gap-2
                text-sm font-bold
                opacity-75
                hover:opacity-100
                transition-opacity
              "
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>
          </div>

          <div className="relative z-10">
            <div className="retro-label mb-5 !bg-primary-foreground/10 !text-primary-foreground !border-primary-foreground/20">
              Get started
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-[0.95] mb-5">
              Take control
              <br />
              of your money.
            </h1>

            <p className="max-w-sm text-sm leading-6 opacity-75">
              Keep your spending, budgets, and financial goals organized
              in one simple place.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-2 w-12 bg-primary-foreground/80 rounded-full" />
              <div className="h-2 w-6 bg-primary-foreground/40 rounded-full" />
              <div className="h-2 w-2 bg-primary-foreground/30 rounded-full" />
            </div>
          </div>

          <div className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] opacity-45">
            Ledgerly Tracker · 2026
          </div>
        </div>

        {/* =====================================================
            FORM PANEL
        ===================================================== */}

        <div className="bg-card px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
          <div className="max-w-md mx-auto">

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >

              {/* Mobile back link */}
              <Link
                to="/"
                className="
                  lg:hidden
                  inline-flex items-center gap-1
                  mb-7
                  text-sm font-bold
                  text-muted
                  hover:text-foreground
                "
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>

              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-2">
                  New account
                </p>

                <h2 className="text-3xl font-black tracking-tight">
                  Create your account
                </h2>

                <p className="text-sm text-muted mt-2">
                  Set things up once and start tracking.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name */}
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                    Name
                  </label>

                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />

                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Your name"
                      required
                      className="
                        input-editorial
                        pl-11
                        h-12
                      "
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />

                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      placeholder="you@example.com"
                      required
                      className="
                        input-editorial
                        pl-11
                        h-12
                      "
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />

                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Create a password"
                      required
                      className="
                        input-editorial
                        pl-11
                        h-12
                      "
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    btn-primary
                    w-full
                    h-13
                    mt-2
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                >
                  {loading ? (
                    <>
                      <div
                        className="
                          w-5 h-5
                          border-2
                          border-primary-foreground/30
                          border-t-primary-foreground
                          rounded-full
                          animate-spin
                        "
                      />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Login link */}
              <div className="mt-8 pt-6 border-t-2 border-border text-center">
                <p className="text-sm text-muted">
                  Already have an account?
                  <Link
                    to="/login"
                    className="
                      ml-1
                      font-bold
                      text-primary
                      hover:text-foreground
                      transition-colors
                    "
                  >
                    Sign in
                  </Link>
                </p>
              </div>

            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
