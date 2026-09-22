import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Target,
  Calendar,
  Tag,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoryService } from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getInitialFormData = () => {
  const now = new Date();

  return {
    limitAmount: '',
    categoryId: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const numberValue = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

export default function BudgetModal({
  isOpen,
  onClose,
  onSave,
  categories = [],
  onCategoryCreated,
  budget = null,
}) {
  const [formData, setFormData] = useState(
    getInitialFormData
  );

  const [isAddingCategory, setIsAddingCategory] =
    useState(false);

  const [newCategoryName, setNewCategoryName] =
    useState('');

  const [saving, setSaving] = useState(false);
  const [addingCategory, setAddingCategory] =
    useState(false);

  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    return Array.from(
      { length: 5 },
      (_, index) => currentYear + index
    );
  }, [currentYear]);

  /*
   * ---------------------------------------------------------
   * INITIALIZE FORM
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (budget) {
      setFormData({
        limitAmount: budget?.limitAmount ?? '',
        categoryId:
          budget?.categoryId != null
            ? String(budget.categoryId)
            : '',
        month:
          budget?.month ??
          new Date().getMonth() + 1,
        year:
          budget?.year ??
          new Date().getFullYear(),
      });
    } else {
      setFormData(getInitialFormData());
    }

    setIsAddingCategory(false);
    setNewCategoryName('');
    setError('');
    setSaving(false);
    setAddingCategory(false);
  }, [isOpen, budget]);

  /*
   * ---------------------------------------------------------
   * BODY SCROLL LOCK
   *
   * Important:
   * The modal is rendered using createPortal() below.
   * Therefore it is outside the sidebar stacking context.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    const previousPaddingRight =
      document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth -
      document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight =
        `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (!saving && !addingCategory) {
          handleClose();
        }
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;

      document.body.style.paddingRight =
        previousPaddingRight;
    };
  }, [isOpen, saving, addingCategory]);

  /*
   * ---------------------------------------------------------
   * CLOSE
   * ---------------------------------------------------------
   */

  const handleClose = () => {
    if (saving || addingCategory) {
      return;
    }

    setFormData(getInitialFormData());
    setIsAddingCategory(false);
    setNewCategoryName('');
    setError('');

    onClose?.();
  };

  /*
   * ---------------------------------------------------------
   * FORM HELPERS
   * ---------------------------------------------------------
   */

  const updateFormData = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError('');
    }
  };

  /*
   * ---------------------------------------------------------
   * ADD CATEGORY
   * ---------------------------------------------------------
   */

  const handleAddCategory = async () => {
    const categoryName =
      newCategoryName.trim();

    if (!categoryName) {
      toast.error(
        'Please enter a category name.'
      );
      return;
    }

    if (categoryName.length < 2) {
      toast.error(
        'Category name must contain at least 2 characters.'
      );
      return;
    }

    if (categoryName.length > 50) {
      toast.error(
        'Category name cannot exceed 50 characters.'
      );
      return;
    }

    const existingCategory =
      categories.find(
        (category) =>
          category?.name
            ?.trim()
            .toLowerCase() ===
          categoryName.toLowerCase()
      );

    if (existingCategory) {
      if (existingCategory?.id) {
        updateFormData(
          'categoryId',
          String(existingCategory.id)
        );
      }

      setIsAddingCategory(false);
      setNewCategoryName('');

      toast.success(
        'Existing category selected'
      );

      return;
    }

    try {
      setAddingCategory(true);
      setError('');

      const response =
        await categoryService.create({
          name: categoryName,
          type: 'EXPENSE',
        });

      const createdCategory = response?.data;

      if (!createdCategory?.id) {
        throw new Error(
          'Category was created but no category ID was returned.'
        );
      }

      updateFormData(
        'categoryId',
        String(createdCategory.id)
      );

      setNewCategoryName('');
      setIsAddingCategory(false);

      toast.success(
        'Category added successfully'
      );

      if (
        typeof onCategoryCreated === 'function'
      ) {
        await onCategoryCreated();
      }
    } catch (err) {
      console.error(
        'Failed to create category:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to create category.';

      setError(message);
      toast.error(message);
    } finally {
      setAddingCategory(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * VALIDATION
   * ---------------------------------------------------------
   */

  const validateForm = () => {
    const amount = numberValue(
      formData.limitAmount
    );

    const categoryId = Number(
      formData.categoryId
    );

    const month = Number(formData.month);
    const year = Number(formData.year);

    if (!formData.limitAmount) {
      return 'Please enter a budget limit.';
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Budget limit must be greater than ₹0.';
    }

    if (amount > 1000000000) {
      return 'Budget limit is too large.';
    }

    if (!formData.categoryId) {
      return 'Please select a category.';
    }

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      return 'Please select a valid category.';
    }

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return 'Please select a valid month.';
    }

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return 'Please enter a valid year.';
    }

    return null;
  };

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || addingCategory) {
      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const payload = {
      limitAmount: numberValue(
        formData.limitAmount
      ),
      categoryId: Number(
        formData.categoryId
      ),
      month: Number(formData.month),
      year: Number(formData.year),
    };

    try {
      setSaving(true);
      setError('');

      await onSave(payload);
    } catch (err) {
      console.error(
        'Budget save failed:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to save budget.';

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * CATEGORY KEYBOARD
   * ---------------------------------------------------------
   */

  const handleCategoryKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (!addingCategory) {
        handleAddCategory();
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();

      if (!addingCategory) {
        setIsAddingCategory(false);
        setNewCategoryName('');
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * AMOUNT
   * ---------------------------------------------------------
   */

  const handleAmountChange = (event) => {
    const value = event.target.value;

    if (value === '') {
      updateFormData(
        'limitAmount',
        ''
      );
      return;
    }

    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0
    ) {
      return;
    }

    updateFormData(
      'limitAmount',
      value
    );
  };

  /*
   * ---------------------------------------------------------
   * DON'T RENDER
   * ---------------------------------------------------------
   */

  if (!isOpen) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * MODAL
   *
   * createPortal is the important fix.
   *
   * This moves the modal outside:
   * - dashboard containers
   * - sidebar stacking contexts
   * - transformed Framer Motion parents
   * - overflow-hidden parents
   *
   * So mobile sidebar z-index cannot cover it.
   * ---------------------------------------------------------
   */

  return createPortal(
    <AnimatePresence>
      <div
        className="
          fixed
          inset-0
          z-[9999]
          flex
          items-start
          justify-center
          overflow-y-auto
          overscroll-contain
          bg-black/55
          backdrop-blur-sm

          p-2
          sm:p-4
          lg:p-5
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
        {/* =================================================
            MODAL
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 12,
            scale: 0.98,
          }}
          transition={{
            duration: 0.18,
            ease: 'easeOut',
          }}
          onMouseDown={(event) =>
            event.stopPropagation()
          }
          className="
            relative
            z-[10000]

            w-full
            max-w-[560px]

            my-2
            sm:my-4
            lg:my-6

            max-h-[calc(100dvh-16px)]
            sm:max-h-[calc(100dvh-32px)]
            lg:max-h-[calc(100dvh-48px)]

            overflow-hidden

            bg-card
            text-foreground

            border
            sm:border-2
            border-border

            rounded-xl
            sm:rounded-2xl

            shadow-[4px_4px_0_var(--border)]
            sm:shadow-[6px_6px_0_var(--border)]

            flex
            flex-col
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              shrink-0

              px-3.5
              py-3.5

              sm:px-5
              sm:py-4

              lg:px-6
              lg:py-5

              border-b
              sm:border-b-2
              border-border
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-3
              "
            >
              <div className="min-w-0">
                {/* Small heading */}
                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    mb-1.5
                  "
                >
                  <div
                    className="
                      w-7
                      h-7

                      sm:w-8
                      sm:h-8

                      rounded-lg
                      bg-primary/10
                      text-primary
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <Target
                      className="
                        w-3.5
                        h-3.5

                        sm:w-4
                        sm:h-4
                      "
                      aria-hidden="true"
                    />
                  </div>

                  <span
                    className="
                      text-[8px]
                      sm:text-[9px]

                      font-bold
                      text-muted
                      uppercase
                      tracking-[0.13em]
                    "
                  >
                    Monthly Planning
                  </span>
                </div>

                {/* Title */}
                <h2
                  id="budget-modal-title"
                  className="
                    text-base
                    sm:text-lg
                    lg:text-xl

                    font-bold
                    text-foreground
                    tracking-tight
                    leading-tight
                  "
                >
                  {budget
                    ? 'Adjust Budget'
                    : 'Set Budget'}
                </h2>

                {/* Description */}
                <p
                  className="
                    text-[10px]
                    sm:text-xs

                    text-muted
                    mt-0.5
                    font-medium
                    leading-snug
                    max-w-[390px]
                  "
                >
                  {budget
                    ? 'Update your spending limit for this category.'
                    : 'Plan your monthly spending limit.'}
                </p>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={handleClose}
                disabled={
                  saving ||
                  addingCategory
                }
                className="
                  shrink-0

                  w-7
                  h-7

                  sm:w-8
                  sm:h-8

                  rounded-lg

                  flex
                  items-center
                  justify-center

                  text-muted
                  hover:text-foreground
                  hover:bg-secondary

                  border
                  border-transparent
                  hover:border-border

                  transition-all

                  disabled:opacity-40
                  disabled:cursor-not-allowed
                "
                aria-label="Close budget modal"
              >
                <X
                  className="
                    w-3.5
                    h-3.5

                    sm:w-4
                    sm:h-4
                  "
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div
            className="
              flex-1
              min-h-0

              overflow-y-auto
              overscroll-contain

              px-3.5
              py-3.5

              sm:px-5
              sm:py-4

              lg:px-6
              lg:py-5

              [scrollbar-width:thin]
            "
          >
            {/* ERROR */}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                  }}
                  className="
                    flex
                    items-start
                    gap-2

                    p-2.5
                    sm:p-3

                    mb-3
                    sm:mb-4

                    rounded-lg

                    border
                    border-rose-500/20

                    bg-rose-500/5

                    text-rose-600
                    dark:text-rose-400
                  "
                >
                  <AlertCircle
                    className="
                      w-3.5
                      h-3.5

                      shrink-0
                      mt-0.5
                    "
                    aria-hidden="true"
                  />

                  <p
                    className="
                      text-[10px]
                      sm:text-xs

                      font-medium
                      leading-snug
                    "
                  >
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              id="budget-form"
              onSubmit={handleSubmit}
              className="
                space-y-3
                sm:space-y-4
              "
              noValidate
            >
              {/* =================================================
                  AMOUNT
              ================================================= */}

              <div className="space-y-1.5">
                <label
                  htmlFor="budget-limit"
                  className="
                    block

                    text-[9px]
                    sm:text-[10px]

                    font-bold
                    text-muted

                    uppercase
                    tracking-[0.12em]

                    px-0.5
                  "
                >
                  Monthly Limit
                </label>

                <div className="relative group">
                  <span
                    className="
                      absolute

                      left-3
                      sm:left-3.5

                      top-1/2
                      -translate-y-1/2

                      text-lg
                      sm:text-xl

                      font-bold
                      text-muted

                      group-focus-within:text-primary

                      transition-colors

                      pointer-events-none

                      z-10
                    "
                  >
                    ₹
                  </span>

                  <input
                    id="budget-limit"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={
                      formData.limitAmount
                    }
                    onChange={
                      handleAmountChange
                    }
                    disabled={saving}
                    className="
                      w-full

                      h-14
                      sm:h-16

                      bg-secondary

                      border
                      sm:border-2
                      border-border

                      rounded-lg
                      sm:rounded-xl

                      py-2

                      pl-9
                      sm:pl-11

                      pr-3

                      text-xl
                      sm:text-2xl
                      lg:text-3xl

                      font-bold
                      text-foreground

                      outline-none

                      focus:border-primary

                      focus:ring-2
                      focus:ring-primary/10

                      transition-all

                      placeholder:text-muted/30

                      disabled:opacity-50
                    "
                  />
                </div>

                <p
                  className="
                    px-0.5

                    text-[9px]
                    sm:text-[10px]

                    text-muted
                    font-medium

                    leading-tight
                  "
                >
                  Maximum amount you want to spend
                </p>
              </div>

              {/* =================================================
                  CATEGORY
              ================================================= */}

              <div className="space-y-1.5">
                <div
                  className="
                    flex
                    justify-between
                    items-center
                    px-0.5
                  "
                >
                  <label
                    htmlFor="budget-category"
                    className="
                      text-[9px]
                      sm:text-[10px]

                      font-bold
                      text-muted

                      uppercase
                      tracking-[0.12em]

                      flex
                      items-center
                      gap-1.5
                    "
                  >
                    <Tag
                      className="
                        w-3
                        h-3
                      "
                      aria-hidden="true"
                    />

                    Category
                  </label>

                  {!budget && (
                    <button
                      type="button"
                      disabled={
                        saving ||
                        addingCategory
                      }
                      onClick={() => {
                        setError('');

                        setIsAddingCategory(
                          (previous) =>
                            !previous
                        );

                        setNewCategoryName('');
                      }}
                      className="
                        text-[9px]
                        sm:text-[10px]

                        font-bold
                        text-primary

                        hover:text-primary/80

                        uppercase
                        tracking-wider

                        transition-colors

                        disabled:opacity-40
                      "
                    >
                      {isAddingCategory
                        ? 'Cancel'
                        : '+ Add New'}
                    </button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {isAddingCategory ? (
                    <motion.div
                      key="new-category"
                      initial={{
                        opacity: 0,
                        x: 10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: -10,
                      }}
                      className="
                        flex
                        gap-1.5
                      "
                    >
                      <input
                        type="text"
                        autoFocus
                        maxLength={50}
                        placeholder="New category..."
                        value={
                          newCategoryName
                        }
                        onChange={(event) => {
                          setNewCategoryName(
                            event.target.value
                          );
                          setError('');
                        }}
                        onKeyDown={
                          handleCategoryKeyDown
                        }
                        disabled={
                          addingCategory
                        }
                        className="
                          flex-1
                          min-w-0

                          h-10
                          sm:h-11

                          px-3

                          rounded-lg

                          bg-secondary

                          border
                          sm:border-2
                          border-border

                          text-xs
                          sm:text-sm

                          text-foreground

                          placeholder:text-muted/50

                          outline-none

                          focus:border-primary
                          focus:ring-2
                          focus:ring-primary/10

                          transition-all

                          disabled:opacity-50
                        "
                      />

                      <button
                        type="button"
                        onClick={
                          handleAddCategory
                        }
                        disabled={
                          addingCategory ||
                          !newCategoryName.trim()
                        }
                        className="
                          w-10
                          h-10

                          sm:w-11
                          sm:h-11

                          shrink-0

                          bg-primary

                          rounded-lg

                          flex
                          items-center
                          justify-center

                          text-primary-foreground

                          border
                          sm:border-2
                          border-border

                          hover:brightness-105

                          transition-all

                          disabled:opacity-50
                          disabled:cursor-not-allowed
                        "
                        aria-label="Add category"
                      >
                        {addingCategory ? (
                          <Loader2
                            className="
                              w-3.5
                              h-3.5
                              animate-spin
                            "
                          />
                        ) : (
                          <Check
                            className="
                              w-3.5
                              h-3.5
                            "
                          />
                        )}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="category-select"
                      initial={{
                        opacity: 0,
                        x: -10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: 10,
                      }}
                    >
                      <select
                        id="budget-category"
                        required
                        value={
                          formData.categoryId
                        }
                        onChange={(event) =>
                          updateFormData(
                            'categoryId',
                            event.target.value
                          )
                        }
                        disabled={
                          saving ||
                          categories.length ===
                            0 ||
                          Boolean(budget)
                        }
                        className="
                          w-full

                          h-10
                          sm:h-11

                          px-3

                          rounded-lg

                          bg-secondary

                          border
                          sm:border-2
                          border-border

                          text-xs
                          sm:text-sm

                          text-foreground

                          outline-none

                          focus:border-primary

                          focus:ring-2
                          focus:ring-primary/10

                          transition-all

                          font-medium

                          disabled:opacity-50
                          disabled:cursor-not-allowed
                        "
                      >
                        <option value="">
                          {categories.length === 0
                            ? 'No categories available'
                            : 'Select Category'}
                        </option>

                        {categories.map(
                          (
                            category,
                            index
                          ) => (
                            <option
                              key={
                                category?.id ??
                                `${category?.name}-${index}`
                              }
                              value={
                                category?.id
                              }
                            >
                              {category?.name ||
                                'Unnamed Category'}
                            </option>
                          )
                        )}
                      </select>

                      {categories.length ===
                        0 && (
                        <p
                          className="
                            text-[9px]
                            sm:text-[10px]

                            text-amber-600
                            dark:text-amber-400

                            mt-1

                            px-0.5
                          "
                        >
                          Create a category first.
                        </p>
                      )}

                      {budget && (
                        <p
                          className="
                            text-[9px]
                            sm:text-[10px]

                            text-muted

                            mt-1

                            px-0.5

                            leading-tight
                          "
                        >
                          Category cannot be changed
                          while editing a budget.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* =================================================
                  MONTH / YEAR
              ================================================= */}

              <div
                className="
                  grid
                  grid-cols-2

                  gap-2
                  sm:gap-3
                "
              >
                {/* Month */}

                <div className="space-y-1.5">
                  <label
                    htmlFor="budget-month"
                    className="
                      text-[9px]
                      sm:text-[10px]

                      font-bold
                      text-muted

                      uppercase
                      tracking-[0.12em]

                      px-0.5

                      flex
                      items-center
                      gap-1.5
                    "
                  >
                    <Calendar
                      className="
                        w-3
                        h-3
                      "
                      aria-hidden="true"
                    />

                    Month
                  </label>

                  <select
                    id="budget-month"
                    value={formData.month}
                    onChange={(event) =>
                      updateFormData(
                        'month',
                        event.target.value
                      )
                    }
                    disabled={
                      saving ||
                      Boolean(budget)
                    }
                    className="
                      w-full

                      h-10
                      sm:h-11

                      px-2.5
                      sm:px-3

                      rounded-lg

                      bg-secondary

                      border
                      sm:border-2
                      border-border

                      text-xs
                      sm:text-sm

                      text-foreground

                      outline-none

                      focus:border-primary

                      focus:ring-2
                      focus:ring-primary/10

                      transition-all

                      font-medium

                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  >
                    {MONTHS.map(
                      (month, index) => (
                        <option
                          key={month}
                          value={index + 1}
                        >
                          {month}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Year */}

                <div className="space-y-1.5">
                  <label
                    htmlFor="budget-year"
                    className="
                      text-[9px]
                      sm:text-[10px]

                      font-bold
                      text-muted

                      uppercase
                      tracking-[0.12em]

                      px-0.5
                    "
                  >
                    Year
                  </label>

                  <select
                    id="budget-year"
                    value={formData.year}
                    onChange={(event) =>
                      updateFormData(
                        'year',
                        event.target.value
                      )
                    }
                    disabled={
                      saving ||
                      Boolean(budget)
                    }
                    className="
                      w-full

                      h-10
                      sm:h-11

                      px-2.5
                      sm:px-3

                      rounded-lg

                      bg-secondary

                      border
                      sm:border-2
                      border-border

                      text-xs
                      sm:text-sm

                      text-foreground

                      outline-none

                      focus:border-primary

                      focus:ring-2
                      focus:ring-primary/10

                      transition-all

                      font-medium

                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  >
                    {availableYears.map(
                      (year) => (
                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* =================================================
                  SUMMARY
              ================================================= */}

              {formData.limitAmount &&
                formData.categoryId && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                    }}
                    className="
                      rounded-lg

                      border
                      sm:border-2

                      border-primary/15

                      bg-primary/5

                      p-2.5
                      sm:p-3
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <div
                        className="
                          w-7
                          h-7

                          sm:w-8
                          sm:h-8

                          rounded-lg

                          bg-primary/10
                          text-primary

                          flex
                          items-center
                          justify-center

                          shrink-0
                        "
                      >
                        <Target
                          className="
                            w-3.5
                            h-3.5
                          "
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            text-[9px]
                            sm:text-[10px]

                            font-medium
                            text-muted
                          "
                        >
                          Planned monthly limit
                        </p>

                        <p
                          className="
                            text-sm
                            sm:text-base

                            font-bold
                            text-foreground

                            mt-0.5
                          "
                        >
                          ₹
                          {numberValue(
                            formData.limitAmount
                          ).toLocaleString(
                            'en-IN',
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div
                className="
                  pt-0.5
                  pb-0.5

                  space-y-1.5
                "
              >
                <button
                  type="submit"
                  disabled={
                    saving ||
                    addingCategory ||
                    categories.length === 0
                  }
                  className="
                    w-full

                    btn-primary

                    h-10
                    sm:h-11

                    px-3

                    rounded-lg

                    text-xs
                    sm:text-sm

                    font-bold

                    flex
                    items-center
                    justify-center

                    gap-1.5

                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {saving ? (
                    <>
                      <Loader2
                        className="
                          w-3.5
                          h-3.5
                          animate-spin
                        "
                      />

                      {budget
                        ? 'Updating Budget...'
                        : 'Saving Budget...'}
                    </>
                  ) : (
                    <>
                      <Target
                        className="
                          w-3.5
                          h-3.5
                        "
                        aria-hidden="true"
                      />

                      {budget
                        ? 'Update Budget Limit'
                        : 'Save Budget Limit'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={
                    saving ||
                    addingCategory
                  }
                  className="
                    w-full

                    h-8
                    sm:h-9

                    text-[10px]
                    sm:text-xs

                    font-semibold
                    text-muted

                    hover:text-foreground
                    hover:bg-secondary

                    rounded-lg

                    transition-colors

                    disabled:opacity-40
                    disabled:cursor-not-allowed
                  "
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
