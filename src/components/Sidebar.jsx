import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Settings,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const MENU_ITEMS = [
  {
    path: '/',
    name: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/transactions',
    name: 'Transactions',
    icon: Receipt,
  },
  {
    path: '/budgets',
    name: 'Budgets',
    icon: PiggyBank,
  },
  {
    path: '/settings',
    name: 'Settings',
    icon: Settings,
  },
];

const THEME_OPTIONS = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
  },
];

const VALID_THEMES = ['light', 'dark', 'system'];

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /*
   * Close the mobile sidebar whenever
   * the route changes.
   */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /*
   * Prevent body scrolling while the
   * mobile sidebar is open.
   */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  /*
   * Close mobile menu with Escape.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  /*
   * Make sure an invalid or undefined theme
   * never breaks the theme selector.
   */
  const currentTheme = VALID_THEMES.includes(theme)
    ? theme
    : 'system';

  /*
   * Safely prepare user information.
   */
  const displayName =
    typeof user?.name === 'string' &&
    user.name.trim()
      ? user.name.trim()
      : 'Guest User';

  const userRole =
    typeof user?.role === 'string' &&
    user.role.trim()
      ? user.role.trim()
      : 'Premium account';

  const avatarLetter =
    displayName.charAt(0).toUpperCase() || 'U';

  /*
   * Check whether a navigation item is active.
   */
  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  /*
   * Handle logout safely and prevent
   * multiple logout requests.
   */
  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  /*
   * Shared sidebar content.
   *
   * This is rendered inside:
   * - desktop fixed sidebar
   * - mobile drawer
   */
  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Logo */}
      <div className="flex shrink-0 items-center gap-4 px-2 mb-10 sm:mb-12">
        <Link
          to="/"
          aria-label="Go to dashboard"
          className="relative group shrink-0"
        >
          <div
            className="
              absolute
              -inset-1
              bg-gradient-to-r
              from-primary
              to-accent
              rounded-xl
              blur
              opacity-25
              group-hover:opacity-100
              transition
              duration-500
            "
          />

          <div
            className="
              relative
              w-11
              h-11
              sm:w-12
              sm:h-12
              bg-card
              rounded-xl
              flex
              items-center
              justify-center
              font-black
              text-primary
              text-2xl
              border
              border-border
              shadow-sm
            "
          >
            L
          </div>
        </Link>

        <Link
          to="/"
          className="min-w-0"
          aria-label="Ledgerly home"
        >
          <h1 className="text-xl font-black tracking-tight text-foreground truncate">
            Ledgerly
          </h1>

          <div className="h-1 w-8 bg-primary rounded-full mt-0.5" />
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2"
        aria-label="Main navigation"
      >
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="block group"
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={`
                  sidebar-item
                  relative
                  min-h-12
                  ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted hover:text-foreground hover:bg-secondary'
                  }
                `}
              >
                <span
                  className={`
                    shrink-0
                    transition-colors
                    duration-300
                    ${
                      active
                        ? 'text-primary-foreground'
                        : 'group-hover:text-primary'
                    }
                  `}
                >
                  <Icon
                    className="w-5 h-5"
                    aria-hidden="true"
                  />
                </span>

                <span className="font-semibold text-sm">
                  {item.name}
                </span>

                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                    className="
                      absolute
                      right-4
                      w-1.5
                      h-1.5
                      rounded-full
                      bg-primary-foreground
                    "
                    aria-hidden="true"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 mt-6">
        {/* Theme Switcher */}
        <div className="mb-6">
          <div
            className="
              p-1
              bg-secondary
              rounded-xl
              flex
              items-center
              justify-between
              border
              border-border
            "
            role="group"
            aria-label="Theme selection"
          >
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active =
                currentTheme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (!VALID_THEMES.includes(option.value)) {
                      return;
                    }

                    setTheme(option.value);
                  }}
                  aria-label={`Use ${option.label} theme`}
                  aria-pressed={active}
                  title={`${option.label} Mode`}
                  className={`
                    min-h-10
                    flex-1
                    flex
                    items-center
                    justify-center
                    py-2
                    rounded-lg
                    transition-all
                    ${
                      active
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon
                    className="w-4 h-4"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* User Section */}
        <div className="pt-5 border-t border-border space-y-4">
          <div className="flex items-center gap-3 px-2 min-w-0">
            {/* Avatar */}
            <div
              className="
                w-10
                h-10
                shrink-0
                rounded-full
                bg-gradient-to-br
                from-primary
                to-accent
                flex
                items-center
                justify-center
                text-primary-foreground
                font-bold
                text-xs
                shadow-md
              "
              aria-hidden="true"
            >
              {avatarLetter}
            </div>

            {/* User details */}
            <div className="overflow-hidden min-w-0">
              <p className="text-foreground font-bold text-sm truncate leading-tight">
                {displayName}
              </p>

              <p className="text-muted text-[10px] uppercase tracking-wider font-semibold truncate leading-tight">
                {userRole}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Sign out"
            className="
              w-full
              min-h-11
              flex
              items-center
              justify-between
              px-4
              sm:px-5
              py-3
              rounded-xl
              text-rose-500
              bg-rose-500/5
              hover:bg-rose-500/10
              transition-all
              duration-300
              border
              border-rose-500/10
              group
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <div className="flex items-center gap-3 min-w-0">
              {loggingOut ? (
                <Loader2
                  className="w-4 h-4 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <LogOut
                  className="
                    w-4
                    h-4
                    shrink-0
                    group-hover:scale-110
                    transition-transform
                  "
                  aria-hidden="true"
                />
              )}

              <span className="font-bold text-[11px] uppercase tracking-widest truncate">
                {loggingOut
                  ? 'Signing Out...'
                  : 'Sign Out'}
              </span>
            </div>

            {!loggingOut && (
              <ChevronRight
                className="
                  w-4
                  h-4
                  shrink-0
                  opacity-30
                  group-hover:opacity-100
                  group-hover:translate-x-0.5
                  transition-all
                "
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* =====================================================
          MOBILE HEADER
          Visible below lg breakpoint
          ===================================================== */}

      <header
        className="
          lg:hidden
          fixed
          top-0
          left-0
          right-0
          h-16
          sm:h-[72px]
          z-40
          bg-background/90
          backdrop-blur-2xl
          border-b
          border-border
        "
      >
        <div className="h-full flex items-center justify-between px-4 sm:px-6">
          {/* Mobile Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 min-w-0"
            aria-label="Ledgerly home"
          >
            <div
              className="
                w-10
                h-10
                shrink-0
                bg-card
                rounded-xl
                flex
                items-center
                justify-center
                font-black
                text-primary
                text-xl
                border-2
                border-border
                shadow-sm
              "
            >
              L
            </div>

            <div className="min-w-0">
              <span className="block text-lg font-black tracking-tight text-foreground truncate">
                Ledgerly
              </span>

              <div className="h-0.5 w-6 bg-primary rounded-full" />
            </div>
          </Link>

          {/* Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            className="
              w-11
              h-11
              shrink-0
              rounded-xl
              border-2
              border-border
              bg-card
              text-foreground
              flex
              items-center
              justify-center
              shadow-sm
              active:translate-y-0.5
              transition
            "
          >
            <Menu
              className="w-5 h-5"
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      {/* =====================================================
          DESKTOP SIDEBAR
          ===================================================== */}

      <aside
        className="
          hidden
          lg:flex
          w-72
          h-screen
          fixed
          left-0
          top-0
          p-7
          xl:p-8
          flex-col
          bg-background/80
          backdrop-blur-2xl
          border-r
          border-border
          z-50
        "
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {/* =====================================================
          MOBILE DRAWER
          ===================================================== */}

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              className="
                lg:hidden
                fixed
                inset-0
                bg-black/40
                backdrop-blur-[2px]
                z-[60]
                cursor-default
              "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              className="
                lg:hidden
                fixed
                left-0
                top-0
                bottom-0
                w-[min(86vw,320px)]
                p-5
                sm:p-6
                bg-background
                border-r
                border-border
                shadow-2xl
                z-[70]
              "
              initial={{
                x: '-100%',
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: '-100%',
              }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 32,
              }}
              aria-label="Mobile sidebar navigation"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="
                  absolute
                  top-5
                  right-5
                  w-10
                  h-10
                  rounded-xl
                  border-2
                  border-border
                  bg-card
                  text-foreground
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  z-10
                "
              >
                <X
                  className="w-5 h-5"
                  aria-hidden="true"
                />
              </button>

              <div className="h-full pt-1">
                {sidebarContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
