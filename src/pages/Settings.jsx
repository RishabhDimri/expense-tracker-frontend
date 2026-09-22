import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Save,
  Sun,
  Moon,
  Monitor,
  Check,
  Mail,
  Smartphone,
  AlertTriangle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

const STORAGE_KEY = 'expense-app-settings';

const defaultSettings = {
  name: '',
  currency: 'INR',
  emailNotifications: true,
  pushNotifications: true,
  budgetAlerts: true,
  transactionAlerts: true,
  monthlySummary: true,
  language: 'en',
};

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        setSettings({
          ...defaultSettings,
          ...parsed,
          name: parsed.name ?? user?.name ?? '',
        });
      } else {
        setSettings({
          ...defaultSettings,
          name: user?.name ?? '',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);

      setSettings({
        ...defaultSettings,
        name: user?.name ?? '',
      });
    } finally {
      setLoaded(true);
    }
  }, [user?.name]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

      toast.success('Settings saved successfully');

      await new Promise((resolve) =>
        setTimeout(resolve, 400)
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Could not save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (value) => {
    setTheme(value);

    toast.success(
      `${value.charAt(0).toUpperCase() + value.slice(1)} theme applied`
    );
  };

  const sections = [
    {
      id: 'profile',
      name: 'Profile',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'security',
      name: 'Security',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: <Palette className="w-4 h-4" />,
    },
    {
      id: 'language',
      name: 'Language',
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />

          <p className="text-muted text-sm font-medium text-center">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-w-0 pb-8 sm:pb-12"
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        className="
          flex
          flex-col
          xl:flex-row
          justify-between
          items-start
          xl:items-center
          gap-4
          mb-6
          sm:mb-7
        "
      >
        <div className="min-w-0">
          <h1
            className="text-3xl font-black text-foreground tracking-tight mb-1"
          >
            Settings
          </h1>

          <p
            className="
              text-muted
              text-sm
              sm:text-base
              font-medium
              leading-relaxed
              max-w-2xl
            "
          >
            Manage your account, preferences and application
            experience.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="
            btn-primary
            w-full
            sm:w-auto
            min-h-12
            flex
            items-center
            justify-center
            gap-2.5
            px-5
            sm:px-6
            py-3
            shadow-primary/20
            shadow-lg
            active:scale-95
            disabled:opacity-60
            disabled:cursor-not-allowed
          "
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}

          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* =====================================================
          MAIN SETTINGS LAYOUT
          ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-4
          gap-4
          sm:gap-5
          items-start
        "
      >
        {/* ===================================================
            SETTINGS NAVIGATION
            =================================================== */}

        <aside className="lg:col-span-1 min-w-0">
          <div
            className="
              glass-card
              p-2
              sm:p-2.5
              lg:sticky
              lg:top-6
            "
          >
            <nav
              className="
                flex
                lg:flex-col
                gap-1
                overflow-x-auto
                lg:overflow-visible
                no-scrollbar
                pb-0.5
              "
              aria-label="Settings navigation"
            >
              {sections.map((section) => {
                const isActive =
                  activeTab === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(section.id)
                    }
                    aria-current={
                      isActive ? 'page' : undefined
                    }
                    className={`
                      relative
                      shrink-0
                      lg:w-full
                      flex
                      items-center
                      justify-center
                      lg:justify-start
                      gap-2
                      sm:gap-3
                      px-3
                      sm:px-4
                      py-3
                      min-h-11
                      rounded-xl
                      transition-all
                      duration-200
                      font-bold
                      text-xs
                      sm:text-sm
                      whitespace-nowrap
                      ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'text-muted hover:text-foreground hover:bg-secondary'
                      }
                    `}
                  >
                    {section.icon}

                    <span>{section.name}</span>

                    {isActive && (
                      <ChevronRight
                        className="
                          hidden
                          lg:block
                          w-4
                          h-4
                          ml-auto
                        "
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ===================================================
            CONTENT
            =================================================== */}

        <main className="lg:col-span-3 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <ProfileSection
                key="profile"
                settings={settings}
                updateSetting={updateSetting}
                user={user}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySection key="security" />
            )}

            {activeTab === 'notifications' && (
              <NotificationsSection
                key="notifications"
                settings={settings}
                updateSetting={updateSetting}
              />
            )}

            {activeTab === 'appearance' && (
              <AppearanceSection
                key="appearance"
                theme={theme}
                onThemeChange={handleThemeChange}
              />
            )}

            {activeTab === 'language' && (
              <LanguageSection
                key="language"
                settings={settings}
                updateSetting={updateSetting}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}


/* ==========================================================================
   PROFILE
   ========================================================================== */

function ProfileSection({
  settings,
  updateSetting,
  user,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 sm:space-y-5"
    >
      <div className="glass-card p-4 sm:p-6 md:p-7">
        <SectionHeader
          icon={<User className="w-5 h-5" />}
          title="Personal Information"
          description="Update the information displayed in your account."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <InputField
            label="Full Name"
            value={settings.name}
            onChange={(e) =>
              updateSetting('name', e.target.value)
            }
            placeholder="Enter your name"
          />

          <InputField
            label="Email Address"
            type="email"
            value={user?.email || ''}
            disabled
            helper="Email is managed by your account."
          />

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-muted uppercase tracking-widest px-1 mb-2">
              Default Currency
            </label>

            <select
              value={settings.currency}
              onChange={(e) =>
                updateSetting(
                  'currency',
                  e.target.value
                )
              }
              className="
                w-full
                bg-secondary
                border
                border-border
                rounded-xl
                px-4
                h-12
                text-sm
                text-foreground
                focus:outline-none
                focus:ring-2
                focus:ring-primary/50
                focus:border-primary
                transition-all
                font-medium
              "
            >
              <option value="INR">
                INR - Indian Rupee (₹)
              </option>
              <option value="USD">
                USD - US Dollar ($)
              </option>
              <option value="EUR">
                EUR - Euro (€)
              </option>
              <option value="GBP">
                GBP - British Pound (£)
              </option>
              <option value="JPY">
                JPY - Japanese Yen (¥)
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6 md:p-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground">
              Account
            </h3>

            <p className="text-muted text-sm mt-0.5">
              Your account information.
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-secondary/40 border border-border min-w-0">
          <p className="text-[11px] uppercase tracking-widest font-black text-muted mb-1.5">
            Account email
          </p>

          <p className="text-sm text-foreground font-semibold break-all">
            {user?.email || 'No email available'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}


/* ==========================================================================
   SECURITY
   ========================================================================== */

function SecuritySection() {
  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [changingPassword, setChangingPassword] =
    useState(false);

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (changingPassword) {
      return;
    }

    if (!currentPassword) {
      toast.error(
        'Please enter your current password.'
      );
      return;
    }

    if (!newPassword) {
      toast.error(
        'Please enter a new password.'
      );
      return;
    }

    if (newPassword.length < 6) {
      toast.error(
        'New password must be at least 6 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        'New passwords do not match.'
      );
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(
        'New password must be different from current password.'
      );
      return;
    }

    try {
      setChangingPassword(true);

      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      toast.success(
        'Password changed successfully.'
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(
        'Failed to change password:',
        error
      );

      const message =
        error?.response?.data?.message ||
        'Unable to change password.';

      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 sm:space-y-5"
    >
      <div className="glass-card p-4 sm:p-6 md:p-7">
        <SectionHeader
          icon={<Shield className="w-5 h-5" />}
          title="Account Security"
          description="Manage your password and account protection."
        />

        <div className="space-y-3">
          <SecurityOption
            icon={<KeyRound className="w-4 h-4" />}
            title="Change Password"
            desc="Update your account password."
            button="Update"
            onClick={() => {
              document
                .getElementById(
                  'change-password-form'
                )
                ?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
            }}
          />

          <SecurityOption
            icon={<Shield className="w-4 h-4" />}
            title="Two-Factor Authentication"
            desc="Add an extra verification step to your account."
            button="Enable"
            onClick={() =>
              toast(
                '2FA can be connected later.'
              )
            }
          />

          <SecurityOption
            icon={<Lock className="w-4 h-4" />}
            title="Active Sessions"
            desc="Review devices currently signed in to your account."
            button="Review"
            onClick={() =>
              toast(
                'Session management can be connected later.'
              )
            }
          />
        </div>
      </div>

      <div
        id="change-password-form"
        className="glass-card p-4 sm:p-6 md:p-7"
      >
        <div className="mb-5">
          <h3 className="text-lg font-bold text-foreground">
            Change Password
          </h3>

          <p className="text-muted text-sm mt-1 leading-relaxed">
            Enter your current password and choose a new one.
          </p>
        </div>

        <form
          onSubmit={handleChangePassword}
          className="space-y-4 sm:space-y-5"
        >
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrentPassword}
            onToggle={() =>
              setShowCurrentPassword(
                (previous) => !previous
              )
            }
          />

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNewPassword}
            onToggle={() =>
              setShowNewPassword(
                (previous) => !previous
              )
            }
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            onToggle={() =>
              setShowConfirmPassword(
                (previous) => !previous
              )
            }
          />

          <button
            type="submit"
            disabled={changingPassword}
            className="
              btn-primary
              w-full
              sm:w-auto
              px-6
              sm:px-7
              py-3
              min-h-12
              flex
              items-center
              justify-center
              gap-2.5
              text-sm
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            {changingPassword ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}


/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

function NotificationsSection({
  settings,
  updateSetting,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 sm:space-y-5"
    >
      <div className="glass-card p-4 sm:p-6 md:p-7">
        <SectionHeader
          icon={<Bell className="w-5 h-5" />}
          title="Notifications"
          description="Choose which notifications you want to receive."
        />

        <div className="space-y-2.5">
          <NotificationToggle
            icon={<Mail className="w-4 h-4" />}
            title="Email Notifications"
            description="Receive important updates by email."
            checked={
              settings.emailNotifications
            }
            onChange={(value) =>
              updateSetting(
                'emailNotifications',
                value
              )
            }
          />

          <NotificationToggle
            icon={<Smartphone className="w-4 h-4" />}
            title="Push Notifications"
            description="Receive notifications from the application."
            checked={
              settings.pushNotifications
            }
            onChange={(value) =>
              updateSetting(
                'pushNotifications',
                value
              )
            }
          />

          <NotificationToggle
            icon={
              <AlertTriangle className="w-4 h-4" />
            }
            title="Budget Alerts"
            description="Notify me when spending approaches a budget limit."
            checked={settings.budgetAlerts}
            onChange={(value) =>
              updateSetting(
                'budgetAlerts',
                value
              )
            }
          />

          <NotificationToggle
            icon={<Bell className="w-4 h-4" />}
            title="Transaction Alerts"
            description="Notify me when a transaction is recorded."
            checked={
              settings.transactionAlerts
            }
            onChange={(value) =>
              updateSetting(
                'transactionAlerts',
                value
              )
            }
          />

          <NotificationToggle
            icon={<Mail className="w-4 h-4" />}
            title="Monthly Summary"
            description="Receive a monthly overview of your finances."
            checked={settings.monthlySummary}
            onChange={(value) =>
              updateSetting(
                'monthlySummary',
                value
              )
            }
          />
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-bold text-foreground">
              Notification preferences
            </h4>

            <p className="text-sm text-muted mt-1 leading-relaxed">
              These preferences are saved locally in your
              browser. If your backend supports notification
              preferences, connect the Save Changes action to
              your user settings API.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


/* ==========================================================================
   APPEARANCE
   ========================================================================== */

function AppearanceSection({
  theme,
  onThemeChange,
}) {
  const themes = [
    {
      id: 'light',
      name: 'Light',
      description: 'Bright and clean interface',
      icon: <Sun className="w-5 h-5" />,
    },
    {
      id: 'dark',
      name: 'Dark',
      description:
        'Dark interface for low-light environments',
      icon: <Moon className="w-5 h-5" />,
    },
    {
      id: 'system',
      name: 'System',
      description:
        'Follow your device preference',
      icon: <Monitor className="w-5 h-5" />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 sm:space-y-5"
    >
      <div className="glass-card p-4 sm:p-6 md:p-7">
        <SectionHeader
          icon={<Palette className="w-5 h-5" />}
          title="Appearance"
          description="Choose how the application should look."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {themes.map((item) => {
            const active = theme === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  onThemeChange(item.id)
                }
                className={`
                  relative
                  text-left
                  p-4
                  sm:p-5
                  rounded-xl
                  border-2
                  transition-all
                  duration-200
                  ${
                    active
                      ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                      : 'border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/60'
                  }
                `}
              >
                <div
                  className={`
                    w-10
                    h-10
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    mb-4
                    ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted'
                    }
                  `}
                >
                  {item.icon}
                </div>

                <h4 className="text-sm font-bold text-foreground">
                  {item.name}
                </h4>

                <p className="text-xs text-muted mt-1.5 leading-relaxed">
                  {item.description}
                </p>

                {active && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-foreground">
              Current theme
            </h4>

            <p className="text-muted text-sm mt-1 leading-relaxed">
              {theme === 'system'
                ? 'Following your device preference'
                : `${
                    theme.charAt(0).toUpperCase() +
                    theme.slice(1)
                  } mode is active`}
            </p>
          </div>

          <div className="self-start sm:self-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            {theme}
          </div>
        </div>
      </div>
    </motion.div>
  );
}


/* ==========================================================================
   LANGUAGE
   ========================================================================== */

function LanguageSection({
  settings,
  updateSetting,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="glass-card p-4 sm:p-6 md:p-7">
        <SectionHeader
          icon={<Globe className="w-5 h-5" />}
          title="Language"
          description="Choose the language used throughout the application."
        />

        <label className="block text-xs font-black text-muted uppercase tracking-widest px-1 mb-2">
          Application Language
        </label>

        <select
          value={settings.language}
          onChange={(e) =>
            updateSetting(
              'language',
              e.target.value
            )
          }
          className="
            w-full
            bg-secondary
            border
            border-border
            rounded-xl
            px-4
            h-12
            text-sm
            text-foreground
            focus:outline-none
            focus:ring-2
            focus:ring-primary/50
            focus:border-primary
            transition-all
            font-medium
          "
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </select>

        <div className="mt-5 p-4 rounded-xl bg-secondary/40 border border-border">
          <p className="text-sm text-muted leading-relaxed">
            Language selection is saved with your settings.
            Full translation requires adding the corresponding
            localization files to the application.
          </p>
        </div>
      </div>
    </motion.div>
  );
}


/* ==========================================================================
   SHARED COMPONENTS
   ========================================================================== */

function SectionHeader({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3 mb-5 sm:mb-6">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <h3 className="text-lg sm:text-xl font-bold text-foreground">
          {title}
        </h3>

        <p className="text-muted text-sm mt-0.5 font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}


function InputField({
  label,
  type = 'text',
  value,
  onChange,
  disabled = false,
  placeholder,
  helper,
}) {
  return (
    <div className="space-y-2 min-w-0">
      <label className="text-xs font-black text-muted uppercase tracking-widest px-1">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full
          max-w-full
          border
          rounded-xl
          px-4
          h-12
          text-sm
          font-medium
          transition-all
          ${
            disabled
              ? 'bg-secondary/50 border-border text-muted cursor-not-allowed'
              : 'bg-secondary border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
          }
        `}
      />

      {helper && (
        <p className="text-xs text-muted px-1 leading-relaxed">
          {helper}
        </p>
      )}
    </div>
  );
}


function SecurityOption({
  icon,
  title,
  desc,
  button,
  onClick,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/50 transition-all">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-background text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>

        <div className="min-w-0">
          <h4 className="text-sm text-foreground font-bold">
            {title}
          </h4>

          <p className="text-muted text-xs font-medium mt-1 leading-relaxed">
            {desc}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="
          shrink-0
          w-full
          sm:w-auto
          px-5
          py-2.5
          min-h-10
          rounded-lg
          font-bold
          text-[10px]
          uppercase
          tracking-widest
          bg-background
          text-muted
          border
          border-border
          hover:text-foreground
          hover:bg-secondary
          transition-all
          active:scale-95
        "
      >
        {button}
      </button>
    </div>
  );
}


function NotificationToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div
      className={`
        flex
        items-center
        justify-between
        gap-3
        sm:gap-4
        p-3
        sm:p-4
        rounded-xl
        border
        transition-all
        duration-200
        ${
          checked
            ? 'bg-primary/5 border-primary/20 shadow-sm shadow-primary/10'
            : 'bg-secondary/30 border-border'
        }
      `}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`
            w-9
            h-9
            sm:w-10
            sm:h-10
            rounded-xl
            flex
            items-center
            justify-center
            shrink-0
            transition-all
            duration-300
            ${
              checked
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-muted'
            }
          `}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h4 className="text-sm text-foreground font-bold">
            {title}
          </h4>

          <p className="text-xs text-muted mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Toggle ${title}`}
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 0.95 }}
        className={`
          relative
          h-7
          w-14
          shrink-0
          rounded-full
          border
          transition-all
          duration-300
          focus:outline-none
          focus:ring-2
          focus:ring-primary/40
          ${
            checked
              ? 'bg-primary border-primary shadow-md shadow-primary/20'
              : 'bg-muted/70 border-border'
          }
        `}
      >
        <motion.span
          layout
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          className={`
            absolute
            top-0.5
            flex
            h-6
            w-6
            items-center
            justify-center
            rounded-full
            bg-white
            shadow
            ${
              checked
                ? 'left-7'
                : 'left-0.5'
            }
          `}
        >
          {checked ? (
            <Check className="w-3 h-3 text-primary" />
          ) : null}
        </motion.span>
      </motion.button>
    </div>
  );
}


function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-muted uppercase tracking-widest px-1">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="••••••••"
          autoComplete={
            label === 'Current Password'
              ? 'current-password'
              : 'new-password'
          }
          className="
            w-full
            bg-secondary
            border
            border-border
            rounded-xl
            px-4
            pr-12
            h-12
            text-sm
            text-foreground
            focus:outline-none
            focus:ring-2
            focus:ring-primary/50
            focus:border-primary
            transition-all
          "
        />

        <button
          type="button"
          onClick={onToggle}
          className="
            absolute
            right-3.5
            top-1/2
            -translate-y-1/2
            text-muted
            hover:text-foreground
            transition-colors
            w-8
            h-8
            flex
            items-center
            justify-center
          "
          aria-label={
            show
              ? `Hide ${label}`
              : `Show ${label}`
          }
        >
          {show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
