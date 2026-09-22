import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Trash2,
  Calendar,
  FileDown,
  X,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  transactionService,
  categoryService,
  reportService,
} from '../services/api';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const INITIAL_FILTERS = {
  type: 'ALL',
  category: 'ALL',
  dateFrom: '',
  dateTo: '',
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const getCategoryName = (transaction) => {
  return (
    transaction?.categoryName ||
    transaction?.category?.name ||
    'Uncategorized'
  );
};

const getCategoryId = (transaction) => {
  return (
    transaction?.categoryId ??
    transaction?.category?.id ??
    null
  );
};

const formatAmount = (amount) => {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return '—';

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  /* ------------------------------------------------------------------------ */
  /* FETCH DATA                                                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await transactionService.getAll(0, 50);

      const data = response?.data;

      setTransactions(
        Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
            ? data
            : []
      );
    } catch (err) {
      console.error('Failed to fetch transactions:', err);

      toast.error('Failed to load transactions');

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();

      const data = response?.data;

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);

      setCategories([]);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* TRANSACTION ACTIONS                                                      */
  /* ------------------------------------------------------------------------ */

  const handleDelete = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await transactionService.delete(id);

      setTransactions((previous) =>
        previous.filter(
          (transaction) => transaction.id !== id
        )
      );

      toast.success('Transaction deleted successfully');
    } catch (err) {
      console.error(
        'Failed to delete transaction:',
        err
      );

      toast.error(
        err?.response?.data?.message ||
          'Failed to delete transaction'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddTransaction = async (txData) => {
    try {
      await transactionService.create(txData);

      setIsTxModalOpen(false);

      await fetchTransactions();

      toast.success('Transaction added successfully');
    } catch (err) {
      console.error(
        'Failed to add transaction:',
        err
      );

      throw err;
    }
  };

  const handleCategoryCreated = async () => {
    await fetchCategories();
  };

  /* ------------------------------------------------------------------------ */
  /* EXPORT                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleExportPDF = async () => {
    if (exporting) return;

    try {
      setExporting(true);

      const today = new Date();

      const firstDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
        .toISOString()
        .split('T')[0];

      const lastDay = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      )
        .toISOString()
        .split('T')[0];

      const response =
        await reportService.getMonthlyReport(
          firstDay,
          lastDay
        );

      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;

      link.setAttribute(
        'download',
        `report_${firstDay}_to_${lastDay}.pdf`
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        'Report generated successfully'
      );
    } catch (err) {
      console.error(
        'Error generating report:',
        err
      );

      toast.error(
        err?.response?.data?.message ||
          'Error generating report'
      );
    } finally {
      setExporting(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* FILTERS                                                                  */
  /* ------------------------------------------------------------------------ */

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');

    toast.success('Filters cleared');
  };

  const hasActiveFilters =
    filters.type !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    searchQuery.trim() !== '';

  /* ------------------------------------------------------------------------ */
  /* FILTER TRANSACTIONS                                                      */
  /* ------------------------------------------------------------------------ */

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      /* Search */

      if (query) {
        const description =
          transaction?.description?.toLowerCase() || '';

        const category =
          getCategoryName(transaction).toLowerCase();

        const amount = String(
          transaction?.amount ?? ''
        ).toLowerCase();

        const matchesSearch =
          description.includes(query) ||
          category.includes(query) ||
          amount.includes(query);

        if (!matchesSearch) {
          return false;
        }
      }

      /* Type */

      if (
        filters.type !== 'ALL' &&
        transaction?.type !== filters.type
      ) {
        return false;
      }

      /* Category */

      if (filters.category !== 'ALL') {
        const selectedCategory = categories.find(
          (category) =>
            String(category?.id) ===
            String(filters.category)
        );

        if (selectedCategory) {
          const transactionCategoryId =
            getCategoryId(transaction);

          const transactionCategoryName =
            getCategoryName(transaction);

          const matchesCategory =
            String(transactionCategoryId) ===
              String(selectedCategory.id) ||
            transactionCategoryName.toLowerCase() ===
              String(selectedCategory.name)
                .toLowerCase();

          if (!matchesCategory) {
            return false;
          }
        }
      }

      /* From date */

      if (filters.dateFrom) {
        if (
          !transaction?.transactionDate ||
          transaction.transactionDate <
            filters.dateFrom
        ) {
          return false;
        }
      }

      /* To date */

      if (filters.dateTo) {
        if (
          !transaction?.transactionDate ||
          transaction.transactionDate >
            filters.dateTo
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    categories,
    filters,
    searchQuery,
  ]);

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                  */
  /* ------------------------------------------------------------------------ */

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (result, transaction) => {
        const amount = Number(
          transaction?.amount || 0
        );

        if (transaction?.type === 'INCOME') {
          result.income += amount;
        } else {
          result.expense += amount;
        }

        return result;
      },
      {
        income: 0,
        expense: 0,
      }
    );
  }, [filteredTransactions]);

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.25,
      }}
      className="w-full max-w-[1600px] mx-auto space-y-6 pb-12"
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-primary" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Cash Flow
            </span>
          </div>

          <h1 className="text-3xl font-black text-foreground tracking-tight mb-1">
            Transactions
          </h1>

          <p className="text-muted text-sm mt-1.5 font-medium">
            Monitor and manage all your financial movements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsTxModalOpen(true)}
          className="btn-primary h-12 px-5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="w-5 h-5" />

          Add Transaction
        </button>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* QUICK SUMMARY                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card border border-border rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">
            Transactions
          </p>

          <p className="text-2xl font-black text-foreground mt-1">
            {filteredTransactions.length}
          </p>
        </div>

        <div className="glass-card border border-border rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">
            Income
          </p>

          <p className="text-2xl font-black text-emerald-500 mt-1">
            ₹{formatAmount(summary.income)}
          </p>
        </div>

        <div className="glass-card border border-border rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">
            Expenses
          </p>

          <p className="text-2xl font-black text-rose-500 mt-1">
            ₹{formatAmount(summary.expense)}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TRANSACTION MODAL                                                   */}
      {/* ------------------------------------------------------------------ */}

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleAddTransaction}
        categories={categories}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* ------------------------------------------------------------------ */}
      {/* TOOLBAR                                                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="glass-card border border-border rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}

          <div className="relative flex-1 min-w-0 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4 group-focus-within:text-primary transition-colors pointer-events-none" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search description, category or amount..."
              className="w-full h-11 bg-secondary/70 border border-border rounded-xl pl-11 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted hover:text-foreground hover:bg-background transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:flex gap-2">
            <button
              type="button"
              onClick={() =>
                setShowFilters((previous) => !previous)
              }
              className={`h-11 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-secondary/70 border-border text-foreground hover:bg-secondary'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />

              <span>Filters</span>

              {hasActiveFilters && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-white text-primary text-[9px] font-black">
                  !
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={exporting}
              className="h-11 px-4 rounded-xl border border-primary/20 bg-primary/5 text-primary flex items-center justify-center gap-2 text-sm font-bold hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}

              <span>
                {exporting ? 'Exporting...' : 'Export'}
              </span>
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* FILTER PANEL                                                   */}
        {/* -------------------------------------------------------------- */}

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-3 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-foreground">
                      Filter Transactions
                    </h3>

                    <p className="text-xs text-muted mt-1">
                      Refine the list using type, category and date.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="h-9 px-3 rounded-lg bg-secondary border border-border text-muted hover:text-foreground flex items-center gap-2 text-xs font-bold transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setShowFilters(false)
                      }
                      className="h-9 px-3 rounded-lg bg-secondary border border-border text-muted hover:text-foreground flex items-center gap-2 text-xs font-bold transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      Close
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* Type */}

                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                      Type
                    </label>

                    <select
                      value={filters.type}
                      onChange={(event) =>
                        updateFilter(
                          'type',
                          event.target.value
                        )
                      }
                      className="w-full h-11 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    >
                      <option value="ALL">
                        All Types
                      </option>

                      <option value="INCOME">
                        Income
                      </option>

                      <option value="EXPENSE">
                        Expense
                      </option>
                    </select>
                  </div>

                  {/* Category */}

                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                      Category
                    </label>

                    <select
                      value={filters.category}
                      onChange={(event) =>
                        updateFilter(
                          'category',
                          event.target.value
                        )
                      }
                      className="w-full h-11 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    >
                      <option value="ALL">
                        All Categories
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* From */}

                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                      From Date
                    </label>

                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />

                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(event) =>
                          updateFilter(
                            'dateFrom',
                            event.target.value
                          )
                        }
                        className="w-full h-11 bg-secondary border border-border rounded-xl pl-10 pr-3 text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  {/* To */}

                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                      To Date
                    </label>

                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />

                      <input
                        type="date"
                        value={filters.dateTo}
                        min={
                          filters.dateFrom || undefined
                        }
                        onChange={(event) =>
                          updateFilter(
                            'dateTo',
                            event.target.value
                          )
                        }
                        className="w-full h-11 bg-secondary border border-border rounded-xl pl-10 pr-3 text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    Showing{' '}
                    <span className="font-black text-foreground">
                      {filteredTransactions.length}
                    </span>{' '}
                    of{' '}
                    <span className="font-black text-foreground">
                      {transactions.length}
                    </span>{' '}
                    transactions
                  </p>

                  {hasActiveFilters && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Filters applied
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* DESKTOP TABLE                                                      */}
      {/* ------------------------------------------------------------------ */}

      <section className="hidden md:block glass-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                  Description
                </th>

                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                  Category
                </th>

                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                  Date
                </th>

                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted text-right">
                  Amount
                </th>

                <th className="w-16 px-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: 6 }).map(
                  (_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />

                          <div className="h-4 w-44 bg-secondary rounded animate-pulse" />
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="h-6 w-24 bg-secondary rounded-md animate-pulse" />
                      </td>

                      <td className="px-6 py-5">
                        <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
                      </td>

                      <td className="px-6 py-5">
                        <div className="h-5 w-24 bg-secondary rounded animate-pulse ml-auto" />
                      </td>

                      <td />
                    </tr>
                  )
                )
              ) : filteredTransactions.length > 0 ? (
                <AnimatePresence initial={false}>
                  {filteredTransactions.map(
                    (transaction, index) => {
                      const isIncome =
                        transaction?.type === 'INCOME';

                      const isDeleting =
                        deletingId === transaction?.id;

                      return (
                        <motion.tr
                          layout
                          key={transaction?.id ?? index}
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: isDeleting ? 0.5 : 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -8,
                          }}
                          transition={{
                            duration: 0.18,
                            delay: Math.min(
                              index * 0.015,
                              0.15
                            ),
                          }}
                          className="group hover:bg-primary/[0.025] transition-colors"
                        >
                          {/* Description */}

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  isIncome
                                    ? 'bg-emerald-500'
                                    : 'bg-rose-500'
                                }`}
                              />

                              <div className="min-w-0">
                                <p className="font-bold text-sm lg:text-[15px] text-foreground truncate max-w-[300px]">
                                  {transaction?.description ||
                                    'General Transaction'}
                                </p>

                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted mt-0.5">
                                  {isIncome
                                    ? 'Income'
                                    : 'Expense'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}

                          <td className="px-6 py-4">
                            <span className="inline-flex max-w-[180px] truncate px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-[10px] font-black text-muted uppercase tracking-wider">
                              {getCategoryName(
                                transaction
                              )}
                            </span>
                          </td>

                          {/* Date */}

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-muted text-sm font-medium whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 opacity-50" />

                              {formatDate(
                                transaction?.transactionDate
                              )}
                            </div>
                          </td>

                          {/* Amount */}

                          <td className="px-6 py-4 text-right">
                            <p
                              className={`text-[15px] font-black tracking-tight ${
                                isIncome
                                  ? 'text-emerald-500'
                                  : 'text-rose-500'
                              }`}
                            >
                              {isIncome ? '+' : '-'} ₹
                              {formatAmount(
                                transaction?.amount
                              )}
                            </p>
                          </td>

                          {/* Delete */}

                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  transaction?.id
                                )
                              }
                              disabled={isDeleting}
                              className="p-2 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Delete transaction"
                            >
                              {isDeleting ? (
                                <span className="block w-4 h-4 border-2 border-muted/30 border-t-rose-500 rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </motion.tr>
                      );
                    }
                  )}
                </AnimatePresence>
              ) : null}
            </tbody>
          </table>

          {/* Desktop empty */}

          {!loading &&
            filteredTransactions.length === 0 && (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                onReset={resetFilters}
              />
            )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE CARDS                                                       */}
      {/* ------------------------------------------------------------------ */}

      <section className="md:hidden">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="glass-card border border-border rounded-2xl p-4"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary animate-pulse" />

                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-secondary rounded animate-pulse" />

                      <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
                    </div>

                    <div className="h-4 w-20 bg-secondary rounded animate-pulse" />
                  </div>
                </div>
              )
            )}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredTransactions.map(
                (transaction, index) => {
                  const isIncome =
                    transaction?.type === 'INCOME';

                  const isDeleting =
                    deletingId === transaction?.id;

                  return (
                    <motion.div
                      key={
                        transaction?.id ?? index
                      }
                      layout
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: isDeleting
                          ? 0.5
                          : 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -8,
                      }}
                      className="glass-card border border-border rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-foreground truncate">
                            {transaction?.description ||
                              'General Transaction'}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted">
                              {getCategoryName(
                                transaction
                              )}
                            </span>

                            <span className="w-1 h-1 rounded-full bg-border" />

                            <span className="text-[10px] font-bold text-muted">
                              {formatDate(
                                transaction?.transactionDate
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              transaction?.id
                            )
                          }
                          disabled={isDeleting}
                          className="p-2 -mr-1 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                          aria-label="Delete transaction"
                        >
                          {isDeleting ? (
                            <span className="block w-4 h-4 border-2 border-muted/30 border-t-rose-500 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                          {isIncome
                            ? 'Income'
                            : 'Expense'}
                        </span>

                        <span
                          className={`text-base font-black ${
                            isIncome
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {isIncome ? '+' : '-'} ₹
                          {formatAmount(
                            transaction?.amount
                          )}
                        </span>
                      </div>
                    </motion.div>
                  );
                }
              )}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
          />
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <p className="text-muted text-[10px] font-black uppercase tracking-widest">
          Showing {filteredTransactions.length} of{' '}
          {transactions.length} records
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="h-9 px-4 rounded-lg bg-card border border-border text-muted font-black text-[10px] uppercase tracking-widest opacity-40"
          >
            Prev
          </button>

          <button
            type="button"
            disabled
            className="h-9 px-4 rounded-lg bg-secondary border border-border text-muted font-black text-[10px] uppercase tracking-widest opacity-40"
          >
            Next
          </button>

          <MoreHorizontal className="w-4 h-4 text-muted" />
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  hasActiveFilters,
  onReset,
}) {
  return (
    <div className="py-16 px-5 text-center">
      <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
        <Search className="w-6 h-6 text-muted" />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-1">
        {hasActiveFilters
          ? 'No matching transactions'
          : 'No transactions found'}
      </h3>

      <p className="text-muted text-sm font-medium max-w-sm mx-auto">
        {hasActiveFilters
          ? 'Try changing or clearing your filters.'
          : 'Your transactions will appear here once you add them.'}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20"
        >
          <RotateCcw className="w-4 h-4" />

          Clear Filters
        </button>
      )}
    </div>
  );
}
