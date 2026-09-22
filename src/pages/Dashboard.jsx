import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  transactionService,
  budgetService,
  categoryService,
} from '../services/api';

import { useAuth } from '../context/AuthContext';

import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Calendar,
  RefreshCw,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

import BudgetModal from '../components/BudgetModal';
import TransactionModal from '../components/TransactionModal';

import { motion, AnimatePresence } from 'framer-motion';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import toast from 'react-hot-toast';


/* =========================================================
   INITIAL DATA
========================================================= */

const INITIAL_DATA = {
  transactions: [],
  budgets: [],
  summary: {
    income: 0,
    expense: 0,
    balance: 0,
  },
};

const INITIAL_CHART_DATA = [];


/* =========================================================
   ANIMATIONS
========================================================= */

const containerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 8,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};


/* =========================================================
   HELPERS
========================================================= */

const numberValue = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};


const formatCurrency = (value) => {
  return numberValue(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
};


const formatDate = (date) => {
  if (!date) {
    return 'No date';
  }

  const stringValue = String(date);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    const [year, month, day] =
      stringValue.split('-').map(Number);

    const parsedDate = new Date(
      year,
      month - 1,
      day
    );

    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return stringValue;
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};


const getDateTime = (date) => {
  if (!date) {
    return 0;
  }

  const parsedDate = new Date(date).getTime();

  return Number.isFinite(parsedDate)
    ? parsedDate
    : 0;
};


const getDateKey = (value) => {
  if (!value) {
    return null;
  }

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


const formatDateKey = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


const getChartDateRange = (period) => {
  const endDate = new Date();

  endDate.setHours(0, 0, 0, 0);

  const startDate = new Date(endDate);

  if (period === 'WEEK') {
    startDate.setDate(
      startDate.getDate() - 6
    );
  } else {
    startDate.setDate(1);
  }

  return {
    startDate,
    endDate,
  };
};


/* =========================================================
   NORMALIZERS
========================================================= */

const normalizeTransactions = (response) => {
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


const normalizeBudgets = (response) => {
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


const normalizeChartData = (response) => {
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


/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(INITIAL_DATA);
  const [categories, setCategories] = useState([]);
  const [chartData, setChartData] = useState(
    INITIAL_CHART_DATA
  );

  const [isBudgetModalOpen, setIsBudgetModalOpen] =
    useState(false);

  const [isTxModalOpen, setIsTxModalOpen] =
    useState(false);

  const [chartView, setChartView] =
    useState('WEEK');

  const [loading, setLoading] =
    useState(true);

  const [chartLoading, setChartLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);


  /* =======================================================
     CURRENT DATE
  ======================================================= */

  const currentDate = useMemo(
    () => new Date(),
    []
  );

  const currentMonth =
    currentDate.getMonth() + 1;

  const currentYear =
    currentDate.getFullYear();

  const userName =
    user?.name?.trim() || 'there';


  /* =======================================================
     FETCH DASHBOARD DATA
  ======================================================= */

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [
        transactionsResult,
        budgetsResult,
      ] = await Promise.all([
        transactionService.getAll(0, 100),
        budgetService.getAll(
          currentMonth,
          currentYear
        ),
      ]);

      const transactions =
        normalizeTransactions(
          transactionsResult?.data
        );

      const budgets =
        normalizeBudgets(
          budgetsResult?.data
        );

      const income = transactions
        .filter(
          (transaction) =>
            transaction?.type === 'INCOME'
        )
        .reduce(
          (total, transaction) =>
            total +
            numberValue(
              transaction?.amount
            ),
          0
        );

      const expense = transactions
        .filter(
          (transaction) =>
            transaction?.type === 'EXPENSE'
        )
        .reduce(
          (total, transaction) =>
            total +
            numberValue(
              transaction?.amount
            ),
          0
        );

      const sortedTransactions =
        [...transactions].sort(
          (a, b) =>
            getDateTime(
              b?.transactionDate
            ) -
            getDateTime(
              a?.transactionDate
            )
        );

      setData({
        transactions: sortedTransactions,
        budgets,
        summary: {
          income,
          expense,
          balance: income - expense,
        },
      });
    } catch (err) {
      console.error(
        'Failed to load dashboard data:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load dashboard data.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);


  /* =======================================================
     FETCH CATEGORIES
  ======================================================= */

  const fetchCategories = useCallback(async () => {
    try {
      const response =
        await categoryService.getAll();

      const categoryData =
        response?.data;

      if (Array.isArray(categoryData)) {
        setCategories(categoryData);
      } else if (
        Array.isArray(categoryData?.content)
      ) {
        setCategories(
          categoryData.content
        );
      } else if (
        Array.isArray(categoryData?.data)
      ) {
        setCategories(
          categoryData.data
        );
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error(
        'Failed to load categories:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load categories.';

      toast.error(message);
    }
  }, []);


  /* =======================================================
     FETCH CHART DATA
  ======================================================= */

  const fetchAnalysisData = useCallback(
    async (period) => {
      try {
        setChartLoading(true);

        const response =
          await transactionService.getAnalysisData(
            period
          );

        const analysisData =
          normalizeChartData(
            response?.data
          );

        setChartData(
          analysisData
        );
      } catch (err) {
        console.error(
          'Failed to load analysis data:',
          err
        );

        setChartData([]);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Unable to load spending analysis.';

        toast.error(message);
      } finally {
        setChartLoading(false);
      }
    },
    []
  );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (!mounted) {
        return;
      }

      await Promise.all([
        fetchData(),
        fetchCategories(),
        fetchAnalysisData('WEEK'),
      ]);
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [
    fetchData,
    fetchCategories,
    fetchAnalysisData,
  ]);


  /* =======================================================
     CHART VIEW
  ======================================================= */

  const handleChartViewChange = async (period) => {
    if (period === chartView) {
      return;
    }

    setChartView(period);

    await fetchAnalysisData(period);
  };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchData(),
        fetchCategories(),
        fetchAnalysisData(chartView),
      ]);

      toast.success(
        'Dashboard refreshed'
      );
    } catch (err) {
      console.error(
        'Refresh failed:',
        err
      );
    } finally {
      setRefreshing(false);
    }
  };


  /* =======================================================
     ADD TRANSACTION
  ======================================================= */

  const handleAddTransaction = async (
    txData
  ) => {
    try {
      await transactionService.create(
        txData
      );

      toast.success(
        'Movement recorded successfully 💸'
      );

      setIsTxModalOpen(false);

      await Promise.all([
        fetchData(),
        fetchAnalysisData(chartView),
      ]);
    } catch (err) {
      console.error(
        'Failed to create transaction:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to create transaction.';

      toast.error(
        `Error: ${message}`
      );
    }
  };


  /* =======================================================
     ADD BUDGET
  ======================================================= */

  const handleAddBudget = async (
    budgetData
  ) => {
    try {
      await budgetService.create(
        budgetData
      );

      toast.success(
        'Budget created successfully 🎯'
      );

      setIsBudgetModalOpen(false);

      await fetchData();
    } catch (err) {
      console.error(
        'Failed to create budget:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to create budget.';

      toast.error(
        `Error: ${message}`
      );
    }
  };


  /* =======================================================
     RECENT TRANSACTIONS
  ======================================================= */

  const recentTransactions =
    useMemo(() => {
      return data.transactions.slice(
        0,
        8
      );
    }, [data.transactions]);


  const summaryInsights = useMemo(() => {
    const {
      income,
      expense,
    } = data.summary;

    const savingsRate =
      income > 0
        ? ((income - expense) / income) * 100
        : 0;

    const expenseRate =
      income > 0
        ? (expense / income) * 100
        : 0;

    const transactionCount =
      data.transactions.length;

    return {
      savingsRate,
      expenseRate,
      transactionCount,
    };
  }, [
    data.summary,
    data.transactions,
  ]);


  /* =======================================================
     EXPENSE CHART
  ======================================================= */

  const expenseChartData =
    useMemo(() => {
      const {
        startDate,
        endDate,
      } = getChartDateRange(
        chartView
      );

      const totalsByDate =
        new Map();

      chartData
        .filter(
          (transaction) =>
            transaction?.type ===
            'EXPENSE'
        )
        .forEach(
          (transaction) => {
            const dateKey =
              getDateKey(
                transaction?.transactionDate
              );

            if (!dateKey) {
              return;
            }

            const currentTotal =
              totalsByDate.get(
                dateKey
              ) || 0;

            totalsByDate.set(
              dateKey,
              currentTotal +
                numberValue(
                  transaction?.amount
                )
            );
          }
        );

      const result = [];
      const cursor =
        new Date(startDate);

      while (cursor <= endDate) {
        const dateKey =
          formatDateKey(cursor);

        result.push({
          transactionDate:
            dateKey,
          amount:
            totalsByDate.get(
              dateKey
            ) || 0,
        });

        cursor.setDate(
          cursor.getDate() + 1
        );
      }

      return result;
    }, [
      chartData,
      chartView,
    ]);

  const hasChartData =
    expenseChartData.length > 0;


  /* =======================================================
     UI
  ======================================================= */

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="
        w-full
        max-w-[1600px]
        mx-auto
        space-y-4
        sm:space-y-5
        lg:space-y-6
        pb-6
        sm:pb-8
        overflow-hidden
      "
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:gap-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <motion.div
          variants={itemVariants}
          className="min-w-0"
        >

          <div className="flex items-center gap-1.5 text-muted mb-1.5 text-[10px] sm:text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 shrink-0" />

            <span className="truncate">
              {currentDate.toLocaleDateString(
                'en-US',
                {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }
              )}
            </span>
          </div>

          <h1 className="
            text-xl
            sm:text-2xl
            lg:text-3xl
            font-black
            text-foreground
            tracking-tight
            leading-tight
            break-words
          ">
            Hey,{' '}
            <span className="text-gradient">
              {userName}
            </span>{' '}
            👋
          </h1>

          <p className="
            text-muted
            text-[11px]
            sm:text-xs
            lg:text-sm
            mt-1
            font-medium
            leading-relaxed
            max-w-xl
          ">
            Welcome back to your financial control center.
          </p>

        </motion.div>


        <motion.div
          variants={itemVariants}
          className="
            flex
            w-full
            sm:w-auto
            flex-col
            xs:flex-row
            sm:flex-row
            gap-2
          "
        >

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              refreshing || loading
            }
            className="
              inline-flex
              flex-1
              sm:flex-none
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border
              border-border
              bg-card
              px-3
              py-2.5
              sm:py-2
              text-xs
              font-bold
              text-foreground
              transition-all
              hover:bg-secondary
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Refresh dashboard"
          >

            <RefreshCw
              className={`w-3.5 h-3.5 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            <span>
              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </span>

          </button>


          <button
            type="button"
            onClick={() =>
              setIsTxModalOpen(true)
            }
            className="
              btn-primary
              flex-1
              sm:flex-none
              !px-4
              !py-2.5
              sm:!py-2
              !rounded-lg
              !text-xs
              !gap-1.5
              whitespace-nowrap
            "
          >

            <Plus className="w-3.5 h-3.5" />

            New Transaction

          </button>

        </motion.div>

      </div>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <motion.div
          variants={itemVariants}
          className="
            flex
            items-start
            gap-2
            rounded-lg
            border
            border-rose-500/20
            bg-rose-500/5
            p-3
            text-rose-500
          "
        >

          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

          <div className="min-w-0">

            <p className="font-bold text-xs">
              Unable to load some dashboard data
            </p>

            <p className="text-[10px] sm:text-xs mt-0.5 opacity-80 break-words">
              {error}
            </p>

          </div>

        </motion.div>
      )}


      {/* ===================================================
          MODALS
      =================================================== */}

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() =>
          setIsTxModalOpen(false)
        }
        onSave={handleAddTransaction}
        categories={categories}
        onCategoryCreated={
          fetchCategories
        }
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() =>
          setIsBudgetModalOpen(false)
        }
        onSave={handleAddBudget}
        categories={categories}
        onCategoryCreated={
          fetchCategories
        }
      />


      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-3
          gap-3
          sm:gap-4
        "
      >

        <SummaryCard
          title="Total Balance"
          amount={data.summary.balance}
          icon={<Wallet className="w-5 h-5" />}
          gradient="from-primary to-accent"
          variants={itemVariants}
          loading={loading}
          subtitle="Available after expenses"
          meta={
            summaryInsights.savingsRate >= 0
              ? `${summaryInsights.savingsRate.toFixed(0)}% savings rate`
              : `${Math.abs(summaryInsights.savingsRate).toFixed(0)}% deficit`
          }
        />


        <SummaryCard
          title="Income"
          amount={data.summary.income}
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="from-emerald-500 to-teal-400"
          variants={itemVariants}
          loading={loading}
          subtitle="Total money received"
          meta={`${summaryInsights.transactionCount} transactions tracked`}
        />


        <SummaryCard
          title="Expenses"
          amount={data.summary.expense}
          icon={<TrendingDown className="w-5 h-5" />}
          gradient="from-rose-500 to-orange-400"
          variants={itemVariants}
          loading={loading}
          subtitle="Total money spent"
          meta={`${summaryInsights.expenseRate.toFixed(0)}% of income`}
        />

      </div>


      {/* ===================================================
          ANALYTICS + BUDGETS
      =================================================== */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-3
          gap-3
          sm:gap-4
        "
      >

        {/* =================================================
            SPENDING CHART
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="
            xl:col-span-2
            glass-card
            p-3.5
            sm:p-4
            lg:p-5
            min-w-0
          "
        >

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
              mb-4
            "
          >

            <div className="min-w-0">

              <div className="flex items-center gap-1.5">

                <BarChart3 className="w-4 h-4 text-primary shrink-0" />

                <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                  Spending Analysis
                </h3>

              </div>

              <p className="text-muted text-[10px] sm:text-xs font-medium mt-0.5">
                Your expense activity overview
              </p>

            </div>


            <div className="
              flex
              self-start
              sm:self-auto
              gap-0.5
              bg-secondary
              p-0.5
              rounded-lg
              border
              border-border
              shrink-0
            ">

              <button
                type="button"
                disabled={chartLoading}
                onClick={() =>
                  handleChartViewChange(
                    'WEEK'
                  )
                }
                className={`
                  px-3
                  py-1.5
                  sm:py-1
                  rounded-md
                  text-[10px]
                  font-bold
                  transition-all
                  ${
                    chartView === 'WEEK'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }
                  disabled:opacity-50
                `}
              >
                WEEK
              </button>

              <button
                type="button"
                disabled={chartLoading}
                onClick={() =>
                  handleChartViewChange(
                    'MONTH'
                  )
                }
                className={`
                  px-3
                  py-1.5
                  sm:py-1
                  rounded-md
                  text-[10px]
                  font-bold
                  transition-all
                  ${
                    chartView === 'MONTH'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }
                  disabled:opacity-50
                `}
              >
                MONTH
              </button>

            </div>

          </div>


          <div
            className="
              h-[220px]
              sm:h-[240px]
              lg:h-[270px]
              xl:h-[290px]
              w-full
              min-w-0
            "
          >

            {chartLoading ? (
              <ChartSkeleton />
            ) : hasChartData ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart
                  data={
                    expenseChartData
                  }
                  margin={{
                    top: 5,
                    right: 4,
                    left: -12,
                    bottom: 2,
                  }}
                >

                  <defs>

                    <linearGradient
                      id="dashboardExpenseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.2}
                      />

                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>


                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                    opacity={0.7}
                  />


                  <XAxis
                    dataKey="transactionDate"
                    stroke="var(--muted)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={18}
                    tickFormatter={
                      formatChartDate
                    }
                  />


                  <YAxis
                    stroke="var(--muted)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                    tickFormatter={(value) =>
                      `₹${formatCompactNumber(
                        value
                      )}`
                    }
                  />


                  <Tooltip
                    cursor={{
                      stroke:
                        'var(--primary)',
                      strokeWidth: 1,
                      strokeDasharray:
                        '4 4',
                    }}
                    labelFormatter={(value) =>
                      formatDate(value)
                    }
                    formatter={(value) => [
                      `₹${formatCurrency(
                        value
                      )}`,
                      'Expense',
                    ]}
                    contentStyle={{
                      background:
                        'var(--card)',
                      border:
                        '1px solid var(--border)',
                      borderRadius:
                        '8px',
                      boxShadow:
                        '3px 3px 0 rgba(0,0,0,0.10)',
                      fontSize: '11px',
                      color:
                        'var(--foreground)',
                    }}
                    labelStyle={{
                      color:
                        'var(--muted)',
                      marginBottom:
                        '3px',
                    }}
                    itemStyle={{
                      color:
                        'var(--foreground)',
                      fontWeight:
                        'bold',
                    }}
                  />


                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Expense"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashboardExpenseGradient)"
                    dot={{
                      r: 2,
                      fill: 'var(--primary)',
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 4,
                      fill: 'var(--primary)',
                      stroke:
                        'var(--background)',
                      strokeWidth: 2,
                    }}
                  />

                </AreaChart>

              </ResponsiveContainer>

            ) : (

              <EmptyChart />

            )}

          </div>

        </motion.div>


        {/* =================================================
            BUDGETS
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="
            glass-card
            p-3.5
            sm:p-4
            lg:p-5
            h-fit
            min-w-0
          "
        >

          <div className="
            flex
            justify-between
            items-center
            gap-3
            mb-4
            border-b
            border-border
            pb-3
          ">

            <div className="min-w-0">

              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Active Budgets
              </h3>

              <p className="text-[10px] sm:text-xs text-muted mt-0.5">
                {formatMonthYear(
                  currentDate
                )}
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                setIsBudgetModalOpen(
                  true
                )
              }
              className="
                shrink-0
                w-8
                h-8
                sm:w-9
                sm:h-9
                bg-primary/10
                rounded-lg
                hover:bg-primary/20
                transition-colors
                flex
                items-center
                justify-center
              "
              aria-label="Create budget"
            >

              <Plus className="w-4 h-4 text-primary" />

            </button>

          </div>


          <div className="space-y-4">

            {loading ? (
              <BudgetSkeleton />
            ) : data.budgets.length > 0 ? (

              data.budgets.map(
                (budget, index) => (
                  <BudgetItem
                    key={
                      budget?.id ??
                      `${budget?.categoryName ?? 'budget'}-${index}`
                    }
                    budget={budget}
                  />
                )
              )

            ) : (

              <div className="py-6 text-center">

                <div className="
                  w-10
                  h-10
                  bg-secondary
                  rounded-full
                  flex
                  items-center
                  justify-center
                  mx-auto
                  mb-2
                ">

                  <Receipt className="w-4 h-4 text-muted" />

                </div>

                <p className="text-muted text-xs font-medium">
                  No budgets set yet.
                </p>

              </div>

            )}

          </div>


          <button
            type="button"
            onClick={() =>
              setIsBudgetModalOpen(
                true
              )
            }
            className="
              w-full
              mt-5
              py-2.5
              rounded-lg
              bg-primary/5
              border
              border-primary/20
              text-primary
              font-bold
              hover:bg-primary/10
              transition-all
              text-[10px]
              uppercase
              tracking-widest
            "
          >
            Plan New Budget
          </button>

        </motion.div>

      </div>


      {/* ===================================================
          RECENT TRANSACTIONS
      =================================================== */}

      <motion.div
        variants={itemVariants}
        className="
          glass-card
          p-3.5
          sm:p-4
          lg:p-5
          min-w-0
        "
      >

        <div className="
          flex
          flex-col
          gap-2.5
          sm:flex-row
          sm:items-center
          sm:justify-between
          mb-4
          border-b
          border-border
          pb-3
        ">

          <div>

            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Recent Activity
            </h3>

            <p className="text-[10px] sm:text-xs text-muted mt-0.5">
              Your latest transactions
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate('/transactions')
            }
            className="
              text-[10px]
              sm:text-xs
              font-black
              text-primary
              hover:text-accent
              transition-colors
              uppercase
              tracking-widest
              text-left
              sm:text-right
              self-start
              sm:self-auto
            "
          >
            View All Transactions
          </button>

        </div>


        {loading ? (
          <TransactionSkeleton />
        ) : (

          <div className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-2
          ">

            <AnimatePresence mode="popLayout">

              {recentTransactions.length > 0 ? (

                recentTransactions.map(
                  (
                    transaction,
                    index
                  ) => (
                    <TransactionItem
                      key={
                        transaction?.id ??
                        `${transaction?.transactionDate}-${index}`
                      }
                      transaction={
                        transaction
                      }
                      index={index}
                    />
                  )
                )

              ) : (

                <div className="col-span-full py-8 text-center">

                  <div className="
                    w-10
                    h-10
                    bg-secondary
                    rounded-full
                    flex
                    items-center
                    justify-center
                    mx-auto
                    mb-2
                  ">

                    <Receipt className="w-4 h-4 text-muted" />

                  </div>

                  <p className="text-foreground text-xs sm:text-sm font-bold">
                    No recent activity
                  </p>

                  <p className="text-muted text-[10px] sm:text-xs mt-0.5">
                    Add your first transaction to see it here.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setIsTxModalOpen(
                        true
                      )
                    }
                    className="
                      mt-3
                      btn-primary
                      !px-4
                      !py-2
                      !text-[10px]
                      !rounded-lg
                    "
                  >

                    <Plus className="w-3.5 h-3.5" />

                    Add Transaction

                  </button>

                </div>

              )}

            </AnimatePresence>

          </div>

        )}

      </motion.div>

    </motion.div>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  amount,
  icon,
  gradient,
  variants,
  loading,
  subtitle,
  meta,
}) {
  return (
    <motion.div
      variants={variants}
      whileHover={
        loading
          ? undefined
          : {
              y: -2,
            }
      }
      className="
        p-3.5
        sm:p-4
        lg:p-5
        rounded-xl
        bg-card
        border
        border-border
        shadow-sm
        relative
        overflow-hidden
        group
        transition-all
        duration-200
        hover:shadow-md
        min-w-0
      "
    >

      <div
        className={`
          absolute
          top-0
          right-0
          w-20
          h-20
          bg-gradient-to-br
          ${gradient}
          opacity-[0.04]
          group-hover:opacity-[0.08]
          transition-opacity
          blur-2xl
        `}
      />


      <div className="relative z-10">

        <div className="
          flex
          items-start
          justify-between
          gap-3
        ">

          <div
            className={`
              bg-gradient-to-br
              ${gradient}
              w-9
              h-9
              sm:w-10
              sm:h-10
              rounded-lg
              flex
              items-center
              justify-center
              shadow-sm
              shrink-0
            `}
          >
            <div className="text-white">
              {icon}
            </div>
          </div>

          <div className="text-right min-w-0">

            <p className="
              text-muted
              text-[9px]
              sm:text-[10px]
              font-black
              uppercase
              tracking-[0.14em]
              truncate
            ">
              {title}
            </p>

            <div className="mt-1">

              {loading ? (
                <div className="
                  h-6
                  sm:h-7
                  w-24
                  sm:w-28
                  ml-auto
                  rounded-md
                  bg-secondary
                  animate-pulse
                " />
              ) : (
                <h2 className="
                  text-lg
                  sm:text-xl
                  lg:text-2xl
                  font-black
                  text-foreground
                  tracking-tight
                  truncate
                ">
                  ₹{formatCurrency(amount)}
                </h2>
              )}

            </div>

          </div>

        </div>


        {!loading && (
          <div className="
            mt-4
            pt-3
            border-t
            border-border/70
            flex
            items-center
            justify-between
            gap-3
          ">

            <div className="min-w-0">

              <p className="
                text-[9px]
                sm:text-[10px]
                text-muted
                font-medium
                truncate
              ">
                {subtitle}
              </p>

              <p className="
                text-[10px]
                sm:text-[11px]
                font-black
                text-foreground
                mt-0.5
                truncate
              ">
                {meta}
              </p>

            </div>

            <div
              className={`
                w-7
                h-7
                rounded-full
                bg-gradient-to-br
                ${gradient}
                flex
                items-center
                justify-center
                opacity-10
                shrink-0
              `}
            >
              {icon}
            </div>

          </div>
        )}

      </div>

    </motion.div>
  );
}


/* =========================================================
   BUDGET ITEM
========================================================= */

function BudgetItem({ budget }) {
  const currentSpending =
    numberValue(
      budget?.currentSpending
    );

  const limitAmount =
    numberValue(
      budget?.limitAmount
    );

  const rawPercentage =
    limitAmount > 0
      ? (currentSpending /
          limitAmount) *
        100
      : currentSpending > 0
        ? 100
        : 0;

  const percentage =
    Math.min(
      Math.max(
        rawPercentage,
        0
      ),
      100
    );

  const isHigh =
    percentage >= 85;

  const isOverBudget =
    limitAmount > 0 &&
    currentSpending >
      limitAmount;


  return (
    <div className="relative min-w-0">

      <div className="
        flex
        justify-between
        items-end
        mb-1.5
        gap-3
      ">

        <div className="min-w-0">

          <p className="
            text-muted
            text-[8px]
            sm:text-[9px]
            uppercase
            tracking-widest
            font-bold
            mb-0.5
            truncate
          ">
            {budget?.categoryName ||
              'Uncategorized'}
          </p>

          <h4 className="
            text-foreground
            font-extrabold
            text-sm
            sm:text-base
            truncate
          ">
            ₹{formatCurrency(
              currentSpending
            )}
          </h4>

        </div>


        <div className="text-right shrink-0">

          <p
            className={`
              text-[10px]
              sm:text-xs
              font-black
              ${
                isOverBudget ||
                isHigh
                  ? 'text-rose-500'
                  : 'text-primary'
              }
            `}
          >
            {rawPercentage > 100
              ? `${Math.round(
                  rawPercentage
                )}%`
              : `${Math.round(
                  percentage
                )}%`}
          </p>

          <p className="text-[8px] sm:text-[9px] text-muted font-medium">
            of ₹{formatCurrency(
              limitAmount
            )}
          </p>

        </div>

      </div>


      <div className="
        w-full
        bg-secondary
        rounded-full
        h-1.5
        overflow-hidden
        border
        border-border
      ">

        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width: `${percentage}%`,
          }}
          transition={{
            duration: 0.7,
            ease: 'easeOut',
          }}
          className={`
            h-full
            rounded-full
            ${
              isOverBudget ||
              isHigh
                ? 'bg-rose-500'
                : 'bg-primary'
            }
          `}
        />

      </div>


      {isOverBudget && (
        <p className="
          text-[8px]
          sm:text-[9px]
          text-rose-500
          font-bold
          mt-1
        ">
          Over budget by ₹
          {formatCurrency(
            currentSpending -
              limitAmount
          )}
        </p>
      )}

    </div>
  );
}


/* =========================================================
   TRANSACTION ITEM
========================================================= */

function TransactionItem({
  transaction,
  index,
}) {
  const isIncome =
    transaction?.type === 'INCOME';

  const amount =
    numberValue(
      transaction?.amount
    );


  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        x: -6,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: 6,
      }}
      transition={{
        delay: Math.min(
          index * 0.02,
          0.12
        ),
      }}
      className="
        group
        flex
        items-center
        justify-between
        gap-3
        px-3
        py-2.5
        sm:py-3
        rounded-lg
        bg-secondary/30
        border
        border-border
        hover:bg-secondary/50
        hover:border-primary/30
        transition-colors
        min-w-0
      "
    >

      <div className="
        flex
        items-center
        gap-2.5
        min-w-0
      ">

        <div
          className={`
            w-8
            h-8
            sm:w-9
            sm:h-9
            rounded-lg
            shrink-0
            flex
            items-center
            justify-center
            ${
              isIncome
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-rose-500/10 text-rose-500'
            }
          `}
        >

          {isIncome ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}

        </div>


        <div className="min-w-0">

          <p className="
            font-bold
            text-xs
            sm:text-sm
            text-foreground
            truncate
          ">
            {transaction?.categoryName ||
              transaction?.description ||
              'Transaction'}
          </p>

          <p className="
            text-[9px]
            sm:text-[10px]
            text-muted
            font-medium
            mt-0.5
            truncate
          ">
            {formatDate(
              transaction?.transactionDate
            )}
          </p>

        </div>

      </div>


      <p
        className={`
          text-xs
          sm:text-sm
          font-black
          shrink-0
          whitespace-nowrap
          ${
            isIncome
              ? 'text-emerald-500'
              : 'text-rose-500'
          }
        `}
      >
        {isIncome ? '+' : '-'} ₹
        {formatCurrency(amount)}
      </p>

    </motion.div>
  );
}


/* =========================================================
   CHART SKELETON
========================================================= */

function ChartSkeleton() {
  return (
    <div className="
      w-full
      h-full
      flex
      flex-col
      justify-end
      gap-2
    ">

      <div className="
        flex-1
        rounded-lg
        bg-secondary/40
        animate-pulse
      " />

      <div className="flex justify-between px-1">

        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="
                h-2
                w-7
                bg-secondary
                rounded
                animate-pulse
              "
            />
          )
        )}

      </div>

    </div>
  );
}


/* =========================================================
   BUDGET SKELETON
========================================================= */

function BudgetSkeleton() {
  return (
    <div className="space-y-4">

      {[1, 2, 3].map(
        (item) => (
          <div
            key={item}
            className="space-y-1.5"
          >

            <div className="flex justify-between">

              <div className="
                h-2
                w-16
                bg-secondary
                rounded
                animate-pulse
              " />

              <div className="
                h-2
                w-8
                bg-secondary
                rounded
                animate-pulse
              " />

            </div>

            <div className="
              h-3.5
              w-24
              bg-secondary
              rounded
              animate-pulse
            " />

            <div className="
              h-1.5
              w-full
              bg-secondary
              rounded-full
              animate-pulse
            " />

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   TRANSACTION SKELETON
========================================================= */

function TransactionSkeleton() {
  return (
    <div className="
      grid
      grid-cols-1
      lg:grid-cols-2
      gap-2
    ">

      {[1, 2, 3, 4].map(
        (item) => (
          <div
            key={item}
            className="
              flex
              items-center
              justify-between
              gap-2
              px-3
              py-2.5
              rounded-lg
              bg-secondary/30
              border
              border-border
            "
          >

            <div className="
              flex
              items-center
              gap-2.5
            ">

              <div className="
                w-8
                h-8
                rounded-lg
                bg-secondary
                animate-pulse
              " />

              <div className="space-y-1">

                <div className="
                  h-2.5
                  w-20
                  bg-secondary
                  rounded
                  animate-pulse
                " />

                <div className="
                  h-2
                  w-14
                  bg-secondary
                  rounded
                  animate-pulse
                " />

              </div>

            </div>

            <div className="
              h-3
              w-12
              bg-secondary
              rounded
              animate-pulse
            " />

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart() {
  return (
    <div className="
      h-full
      flex
      flex-col
      items-center
      justify-center
      text-center
      px-4
    ">

      <div className="
        w-10
        h-10
        rounded-full
        bg-secondary
        flex
        items-center
        justify-center
        mb-2
      ">

        <BarChart3 className="w-4 h-4 text-muted" />

      </div>

      <p className="font-bold text-xs sm:text-sm text-foreground">
        No expense data
      </p>

      <p className="
        text-[10px]
        sm:text-xs
        text-muted
        mt-0.5
        max-w-xs
      ">
        Add expense transactions to see your spending analysis.
      </p>

    </div>
  );
}


/* =========================================================
   CHART DATE FORMAT
========================================================= */

function formatChartDate(value) {
  if (!value) {
    return '';
  }

  const stringValue =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {
    const [
      year,
      month,
      day,
    ] =
      stringValue
        .split('-')
        .map(Number);

    const date = new Date(
      year,
      month - 1,
      day
    );

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
      }
    );
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return stringValue;
  }

  return parsedDate.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
    }
  );
}


/* =========================================================
   COMPACT NUMBER FORMAT
========================================================= */

function formatCompactNumber(
  value
) {
  const number =
    numberValue(value);

  if (number >= 10000000) {
    return `${(
      number / 10000000
    ).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `${(
      number / 100000
    ).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(1)}K`;
  }

  return Math.round(
    number
  ).toString();
}


/* =========================================================
   MONTH / YEAR
========================================================= */

function formatMonthYear(date) {
  return date.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  );
}
