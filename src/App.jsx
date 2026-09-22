import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext';

import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Settings from './pages/Settings';


/* =========================================================
   LOADING SCREEN
   ========================================================= */

const LoadingScreen = () => {
  return (
    <div
      className="
        min-h-screen
        w-full
        bg-background
        text-foreground
        flex
        items-center
        justify-center
        px-4
        sm:px-6
      "
    >
      <div
        className="
          w-full
          max-w-sm
          flex
          items-center
          gap-4
          rounded-xl
          border-2
          border-border
          bg-card
          px-5
          py-5
          sm:px-7
          sm:py-5
          shadow-[3px_3px_0_var(--border)]
        "
      >
        <div
          className="
            h-5
            w-5
            shrink-0
            rounded-full
            border-2
            border-primary/25
            border-t-primary
            animate-spin
          "
          aria-hidden="true"
        />

        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-bold text-foreground">
            Loading
          </span>

          <span className="text-xs text-muted">
            Preparing your finances...
          </span>
        </div>
      </div>
    </div>
  );
};


/* =========================================================
   PROTECTED ROUTE
   ========================================================= */

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};


/* =========================================================
   APP
   ========================================================= */

function App() {
  return (
    <Router>
      <AuthProvider>

        {/* =================================================
            GLOBAL TOASTS
            ================================================= */}

        <Toaster
          position="top-right"
          gutter={12}
          toastOptions={{
            duration: 3500,

            className: 'font-sans',

            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '2px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '3px 3px 0 var(--border)',
              padding: '13px 16px',
              fontWeight: '600',
              maxWidth: 'calc(100vw - 32px)',
            },

            success: {
              iconTheme: {
                primary: 'var(--success)',
                secondary: 'var(--card)',
              },
            },

            error: {
              iconTheme: {
                primary: 'var(--danger)',
                secondary: 'var(--card)',
              },
            },
          }}
        />


        {/* =================================================
            APPLICATION CONTAINER
            ================================================= */}

        <div
          className="
            app-container
            min-h-screen
            w-full
            max-w-full
            overflow-x-hidden
            bg-background
            text-foreground
            transition-colors
            duration-200
          "
        >

          <Routes>

            {/* ---------------------------------------------
                PUBLIC
                --------------------------------------------- */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />


            {/* ---------------------------------------------
                PROTECTED
                --------------------------------------------- */}

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/budgets"
              element={
                <ProtectedRoute>
                  <Budgets />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />


            {/* ---------------------------------------------
                FALLBACK
                --------------------------------------------- */}

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>

        </div>

      </AuthProvider>
    </Router>
  );
}

export default App;
