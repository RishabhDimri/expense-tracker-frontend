import { useCallback, useEffect, useMemo, useState } from 'react';
import { budgetService, categoryService } from '../services/api';
import {
  Plus,
  AlertTriangle,
  Target,
  TrendingUp,
  ChevronRight,
  Trash2,
  RefreshCw,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BudgetModal from '../components/BudgetModal';
import toast from 'react-hot-toast';

const numberValue = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) => {
  return numberValue(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
};

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.content)) {
    return response.content;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [error, setError] = useState(null);

  const currentDate = useMemo(() => new Date(), []);

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const handleEditBudget = (budget) => {
    if (!budget?.id) {
      toast.error('Invalid budget.');
      return;
    }

    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const fetchBudgets = useCallback(async () => {
    try {
      setError(null);

      const response = await budgetService.getAll(
        currentMonth,
        currentYear
      );

      const budgetData = normalizeArrayResponse(response?.data);

      setBudgets(budgetData);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load budgets.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);

      const response = await categoryService.getAll();

      const categoryData = normalizeArrayResponse(response?.data);

      setCategories(categoryData);
    } catch (err) {
      console.error('Failed to fetch categories:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load categories.';

      toast.error(message);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [fetchBudgets, fetchCategories]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchBudgets(),
        fetchCategories(),
      ]);

      toast.success('Budgets refreshed');
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      toast.error('Invalid budget');
      return;
    }

    const confirmed = window.confirm(
      'Delete this budget? Monitoring will stop for this category.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await budgetService.delete(id);

      toast.success('Budget removed successfully');

      await fetchBudgets();
    } catch (err) {
      console.error('Failed to delete budget:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to remove budget.';

      toast.error(message);
    }
  };

  const handleSaveBudget = async (budgetData) => {
    try {
      if (editingBudget?.id) {
        await budgetService.update(
          editingBudget.id,
          budgetData
        );

        toast.success('Budget limit updated successfully 🎯');
      } else {
        await budgetService.create(budgetData);

        toast.success('Budget created successfully 🎯');
      }

      setIsModalOpen(false);
      setEditingBudget(null);

      await fetchBudgets();
    } catch (err) {
      console.error('Failed to save budget:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Error saving budget.';

      toast.error(message);
    }
  };

  const container = {
    hidden: {
      opacity: 0,
    },

    show: {
      opacity: 1,

      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const item = {
    hidden: {
      opacity: 0,
      y: 12,
    },

    show: {
      opacity: 1,
      y: 0,

      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-7 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Wallet className="w-4 h-4 text-muted" />

            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-3xl font-black text-foreground tracking-tight mb-1">
            Budgets
          </h1>

          <p className="text-muted text-sm md:text-base">
            Set monthly spending limits for categories and cultivate
            discipline.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card text-muted hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />

            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Target className="w-4 h-4" />

            Set New Budget
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          variants={item}
          className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-rose-500"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

          <div>
            <p className="font-bold text-sm">
              Unable to load budgets
            </p>

            <p className="text-xs mt-0.5 opacity-80">
              {error}
            </p>
          </div>
        </motion.div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        categories={categories}
        onCategoryCreated={fetchCategories}
        budget={editingBudget}
      />

      {/* Loading */}
      {loading ? (
        <BudgetLoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {budgets.map((budget, index) => (
              <BudgetCard
                key={
                  budget?.id ??
                  `${budget?.categoryName ?? 'budget'}-${index}`
                }
                budget={budget}
                variants={item}
                onDelete={handleDelete}
                onEdit={handleEditBudget}
              />
            ))}

            {/* Create Card */}
            <motion.button
              type="button"
              onClick={() => setIsModalOpen(true)}
              variants={item}
              whileHover={{
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.985,
              }}
              className="glass rounded-[26px] p-6 border-2 border-dashed border-border bg-transparent hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center min-h-[350px] text-center"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-muted" />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1.5">
                Expand Your Control
              </h3>

              <p className="text-muted text-sm max-w-[200px] leading-relaxed">
                Add a new spending category and start monitoring it today.
              </p>
            </motion.button>
          </AnimatePresence>

          {budgets.length === 0 && (
            <motion.div
              variants={item}
              className="md:col-span-2 lg:col-span-3 py-8 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-muted" />
              </div>

              <h3 className="text-base font-bold text-foreground">
                No budgets for this month
              </h3>

              <p className="text-sm text-muted mt-1">
                Create a budget to start tracking your spending.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function BudgetCard({
  budget,
  variants,
  onDelete,
  onEdit,
}) {
  const currentSpending = numberValue(
    budget?.currentSpending
  );

  const limitAmount = numberValue(
    budget?.limitAmount
  );

  const rawPercentage =
    limitAmount > 0
      ? (currentSpending / limitAmount) * 100
      : currentSpending > 0
        ? 100
        : 0;

  const isOver = rawPercentage > 100;

  const isWarning =
    rawPercentage >= 85 && !isOver;

  const progress = Math.min(
    Math.max(rawPercentage, 0),
    100
  );

  let statusText = 'WITHIN BUDGET';
  let statusClass = 'text-emerald-500';
  let iconClass =
    'bg-primary/10 text-primary';
  let progressClass =
    'bg-gradient-to-r from-primary to-primary/70';
  let topBarClass = 'bg-primary';

  if (isOver) {
    statusText = 'LIMIT EXCEEDED';
    statusClass = 'text-rose-500';
    iconClass = 'bg-rose-500/10 text-rose-500';
    progressClass =
      'bg-gradient-to-r from-rose-600 to-rose-400';
    topBarClass = 'bg-rose-500';
  } else if (isWarning) {
    statusText = 'CAUTION: NEAR LIMIT';
    statusClass = 'text-amber-500';
    iconClass = 'bg-amber-500/10 text-amber-500';
    progressClass =
      'bg-gradient-to-r from-amber-600 to-amber-400';
    topBarClass = 'bg-amber-500';
  }

  return (
    <motion.div
      variants={variants}
      layout
      whileHover={{
        y: -4,
        transition: {
          duration: 0.2,
        },
      }}
      className="glass rounded-[26px] p-6 shadow-xl relative overflow-hidden group border border-border"
    >
      {/* Top Progress Indicator */}
      <div
        className={`absolute top-0 left-0 h-1 transition-all duration-1000 ${topBarClass}`}
        style={{
          width: `${progress}%`,
        }}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-6 gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted mb-1">
            Target Category
          </p>

          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {budget?.categoryName || 'Uncategorized'}
          </h3>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <div
            className={`p-3 rounded-xl ${iconClass}`}
          >
            {isWarning || isOver ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete(budget?.id)}
            disabled={!budget?.id}
            className="p-3 rounded-xl bg-secondary text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Delete ${
              budget?.categoryName || 'budget'
            } budget`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Amounts */}
      <div className="space-y-4">
        <div className="flex justify-between items-end gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-muted">
              Currently spent
            </p>

            <p className="text-2xl font-black text-foreground">
              ₹{formatCurrency(currentSpending)}
            </p>
          </div>

          <div className="text-right space-y-0.5">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">
              Limit
            </p>

            <p className="text-base font-bold text-muted group-hover:text-foreground transition-colors">
              ₹{formatCurrency(limitAmount)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="relative pt-2">
          <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden border border-border">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 1.2,
                ease: 'circOut',
              }}
              className={`h-full rounded-full ${progressClass}`}
            />
          </div>

          <div className="flex justify-between mt-2.5 gap-3">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${statusClass}`}
            >
              {statusText}
            </span>

            <span className="text-[11px] font-semibold text-muted whitespace-nowrap">
              {Math.round(rawPercentage)}% Utilized
            </span>
          </div>

          {isOver && (
            <p className="text-xs text-rose-500 font-semibold mt-2">
              Over limit by ₹
              {formatCurrency(
                currentSpending - limitAmount
              )}
            </p>
          )}

          {!isOver && limitAmount > 0 && (
            <p className="text-xs text-muted mt-2">
              ₹
              {formatCurrency(
                Math.max(
                  limitAmount - currentSpending,
                  0
                )
              )}{' '}
              remaining
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <button
        type="button"
        onClick={() => onEdit(budget)}
        className="w-full mt-6 py-3 flex items-center justify-center gap-2 border border-border bg-secondary/40 rounded-xl text-muted font-semibold text-xs uppercase tracking-wider group-hover:bg-secondary group-hover:text-foreground transition-all"
      >
        Adjust Limits

        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function BudgetLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="glass rounded-[26px] p-6 min-h-[350px] border border-border"
        >
          <div className="flex justify-between mb-6">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
              <div className="h-6 w-32 rounded bg-secondary animate-pulse" />
            </div>

            <div className="w-12 h-12 rounded-xl bg-secondary animate-pulse" />
          </div>

          <div className="flex justify-between mb-6">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
              <div className="h-8 w-28 rounded bg-secondary animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="h-3 w-14 rounded bg-secondary animate-pulse" />
              <div className="h-5 w-20 rounded bg-secondary animate-pulse" />
            </div>
          </div>

          <div className="h-2.5 w-full rounded-full bg-secondary animate-pulse" />

          <div className="h-3 w-full mt-3 rounded bg-secondary animate-pulse" />

          <div className="h-11 w-full mt-7 rounded-xl bg-secondary animate-pulse" />
        </div>
      ))}
    </div>
  );
}
