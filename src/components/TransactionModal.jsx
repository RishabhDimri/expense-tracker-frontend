import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Minus,
  Calendar,
  Tag,
  Info,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoryService } from '../services/api';
import toast from 'react-hot-toast';

const getInitialFormData = () => ({
  amount: '',
  description: '',
  type: 'EXPENSE',
  categoryId: '',
  transactionDate: new Date()
    .toISOString()
    .split('T')[0],
});

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  categories = [],
  onCategoryCreated,
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

  /*
   * ---------------------------------------------------------
   * INITIALIZE FORM
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(getInitialFormData());
    setIsAddingCategory(false);
    setNewCategoryName('');
    setSaving(false);
    setAddingCategory(false);
    setError('');
  }, [isOpen]);

  /*
   * ---------------------------------------------------------
   * BODY SCROLL LOCK
   *
   * Modal is rendered directly into document.body
   * using createPortal().
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
   * TYPE
   * ---------------------------------------------------------
   */

  const handleTypeChange = (type) => {
    setFormData((previous) => ({
      ...previous,
      type,
      categoryId: '',
    }));

    setIsAddingCategory(false);
    setNewCategoryName('');
    setError('');
  };

  /*
   * ---------------------------------------------------------
   * FILTER CATEGORIES
   * ---------------------------------------------------------
   */

  const filteredCategories = categories.filter(
    (category) => {
      if (!category?.type) {
        return true;
      }

      return category.type === formData.type;
    }
  );

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

    const duplicate = categories.find(
      (category) =>
        category?.name
          ?.trim()
          .toLowerCase() ===
          categoryName.toLowerCase() &&
        (!category?.type ||
          category.type === formData.type)
    );

    if (duplicate) {
      updateFormData(
        'categoryId',
        String(duplicate.id)
      );

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
          type: formData.type,
        });

      const createdCategory =
        response?.data;

      if (!createdCategory?.id) {
        throw new Error(
          'Category was created but no category ID was returned.'
        );
      }

      updateFormData(
        'categoryId',
        String(createdCategory.id)
      );

      setIsAddingCategory(false);
      setNewCategoryName('');

      toast.success(
        'Category added successfully'
      );

      if (
        typeof onCategoryCreated ===
        'function'
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
    const amount = Number(
      formData.amount
    );

    const categoryId = Number(
      formData.categoryId
    );

    if (
      formData.amount === '' ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return (
        'Please enter an amount greater than ₹0.'
      );
    }

    if (amount > 1000000000) {
      return 'The amount is too large.';
    }

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      return 'Please select a category.';
    }

    if (!formData.transactionDate) {
      return 'Please select a transaction date.';
    }

    const selectedDate = new Date(
      `${formData.transactionDate}T00:00:00`
    );

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return 'Please select a valid date.';
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

    const submissionData = {
      amount: Number(formData.amount),
      description:
        formData.description.trim(),
      type: formData.type,
      categoryId: Number(
        formData.categoryId
      ),
      transactionDate:
        formData.transactionDate,
    };

    try {
      setSaving(true);
      setError('');

      await onSave(submissionData);
    } catch (err) {
      console.error(
        'Transaction save failed:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to save transaction.';

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
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
      updateFormData('amount', '');
      return;
    }

    const amount = Number(value);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return;
    }

    updateFormData(
      'amount',
      value
    );
  };

  /*
   * ---------------------------------------------------------
   * CATEGORY KEYBOARD
   * ---------------------------------------------------------
   */

  const handleCategoryKeyDown = (
    event
  ) => {
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
   * DON'T RENDER
   * ---------------------------------------------------------
   */

  if (!isOpen) {
    return null;
  }

  const isIncome =
    formData.type === 'INCOME';

  /*
   * ---------------------------------------------------------
   * PORTAL MODAL
   *
   * This is the important sidebar fix.
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

          p-1.5
          sm:p-3
          lg:p-4
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
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
            y: 10,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 10,
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
            max-w-[540px]

            my-1.5
            sm:my-3
            lg:my-5

            max-h-[calc(100dvh-12px)]
            sm:max-h-[calc(100dvh-24px)]
            lg:max-h-[calc(100dvh-40px)]

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

              px-3
              py-2.5

              sm:px-4
              sm:py-3

              lg:px-5
              lg:py-3.5

              border-b
              border-border
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-2.5
              "
            >
              <div className="min-w-0">
                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    mb-1
                  "
                >
                  <div
                    className={`
                      w-6
                      h-6

                      sm:w-7
                      sm:h-7

                      rounded-lg

                      flex
                      items-center
                      justify-center

                      shrink-0

                      border

                      ${
                        isIncome
                          ? `
                            bg-emerald-500/10
                            border-emerald-500/20
                          `
                          : `
                            bg-rose-500/10
                            border-rose-500/20
                          `
                      }
                    `}
                  >
                    {isIncome ? (
                      <Plus
                        className="
                          w-3
                          h-3

                          sm:w-3.5
                          sm:h-3.5

                          text-emerald-500
                        "
                        aria-hidden="true"
                      />
                    ) : (
                      <Minus
                        className="
                          w-3
                          h-3

                          sm:w-3.5
                          sm:h-3.5

                          text-rose-500
                        "
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <span
                    className="
                      text-[8px]
                      sm:text-[9px]

                      font-bold
                      text-primary

                      uppercase
                      tracking-[0.13em]
                    "
                  >
                    Cash Flow
                  </span>
                </div>

                <h2
                  id="transaction-modal-title"
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
                  New Transaction
                </h2>

                <p
                  className="
                    text-[9px]
                    sm:text-[10px]

                    text-muted

                    mt-0.5

                    font-medium
                    leading-snug
                  "
                >
                  Record your income or
                  expense.
                </p>
              </div>

              {/* CLOSE */}

              <button
                type="button"
                onClick={handleClose}
                disabled={
                  saving ||
                  addingCategory
                }
                aria-label="Close transaction modal"
                className="
                  shrink-0

                  w-7
                  h-7

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
              >
                <X
                  className="
                    w-3.5
                    h-3.5
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

              px-3
              py-3

              sm:px-4
              sm:py-3.5

              lg:px-5
              lg:py-4

              [scrollbar-width:thin]
            "
          >
            {/* =================================================
                ERROR
            ================================================= */}

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

                    p-2

                    mb-2.5
                    sm:mb-3

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
                      text-[9px]
                      sm:text-[10px]

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
              id="transaction-form"
              onSubmit={handleSubmit}
              className="
                space-y-2.5
                sm:space-y-3
              "
              noValidate
            >
              {/* =================================================
                  TYPE
              ================================================= */}

              <div className="space-y-1">
                <label
                  className="
                    block

                    text-[8px]
                    sm:text-[9px]

                    font-bold
                    text-muted

                    uppercase
                    tracking-[0.12em]

                    px-0.5
                  "
                >
                  Transaction Type
                </label>

                <div
                  className="
                    grid
                    grid-cols-2

                    gap-1

                    p-0.5

                    rounded-lg

                    bg-secondary

                    border
                    border-border
                  "
                  role="group"
                  aria-label="Transaction type"
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleTypeChange(
                        'EXPENSE'
                      )
                    }
                    disabled={
                      saving ||
                      addingCategory
                    }
                    aria-pressed={!isIncome}
                    className={`
                      h-8
                      sm:h-9

                      flex
                      items-center
                      justify-center

                      gap-1.5

                      rounded-md

                      text-[10px]
                      sm:text-[11px]

                      font-bold

                      transition-all

                      ${
                        !isIncome
                          ? `
                            bg-rose-500
                            text-white
                            shadow-sm
                          `
                          : `
                            text-muted
                            hover:text-foreground
                          `
                      }

                      disabled:opacity-50
                    `}
                  >
                    <Minus
                      className="
                        w-3
                        h-3
                      "
                      aria-hidden="true"
                    />

                    Expense
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleTypeChange(
                        'INCOME'
                      )
                    }
                    disabled={
                      saving ||
                      addingCategory
                    }
                    aria-pressed={isIncome}
                    className={`
                      h-8
                      sm:h-9

                      flex
                      items-center
                      justify-center

                      gap-1.5

                      rounded-md

                      text-[10px]
                      sm:text-[11px]

                      font-bold

                      transition-all

                      ${
                        isIncome
                          ? `
                            bg-emerald-500
                            text-white
                            shadow-sm
                          `
                          : `
                            text-muted
                            hover:text-foreground
                          `
                      }

                      disabled:opacity-50
                    `}
                  >
                    <Plus
                      className="
                        w-3
                        h-3
                      "
                      aria-hidden="true"
                    />

                    Income
                  </button>
                </div>
              </div>

              {/* =================================================
                  AMOUNT
              ================================================= */}

              <div className="space-y-1">
                <label
                  htmlFor="transaction-amount"
                  className="
                    block

                    text-[8px]
                    sm:text-[9px]

                    font-bold
                    text-muted

                    uppercase
                    tracking-[0.12em]

                    px-0.5
                  "
                >
                  Amount
                </label>

                <div className="relative group">
                  <span
                    className={`
                      absolute

                      left-3

                      top-1/2
                      -translate-y-1/2

                      text-lg
                      sm:text-xl

                      font-bold

                      pointer-events-none

                      z-10

                      ${
                        isIncome
                          ? 'text-emerald-500'
                          : 'text-primary'
                      }
                    `}
                  >
                    ₹
                  </span>

                  <input
                    id="transaction-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={
                      formData.amount
                    }
                    onChange={
                      handleAmountChange
                    }
                    disabled={saving}
                    className={`
                      w-full

                      h-12
                      sm:h-14

                      bg-secondary

                      border
                      sm:border-2

                      rounded-lg
                      sm:rounded-xl

                      pl-9
                      sm:pl-10

                      pr-3

                      text-xl
                      sm:text-2xl

                      font-bold
                      text-foreground

                      outline-none

                      placeholder:text-muted/30

                      focus:ring-2

                      transition-all

                      disabled:opacity-50

                      ${
                        isIncome
                          ? `
                            border-emerald-500/30
                            focus:border-emerald-500
                            focus:ring-emerald-500/10
                          `
                          : `
                            border-border
                            focus:border-primary
                            focus:ring-primary/10
                          `
                      }
                    `}
                  />
                </div>
              </div>

              {/* =================================================
                  CATEGORY + DATE
              ================================================= */}

              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2

                  gap-2
                  sm:gap-2.5
                "
              >
                {/* CATEGORY */}

                <div className="min-w-0 space-y-1">
                  <div
                    className="
                      flex
                      justify-between
                      items-center
                      px-0.5
                    "
                  >
                    <label
                      htmlFor="transaction-category"
                      className="
                        text-[8px]
                        sm:text-[9px]

                        font-bold
                        text-muted

                        uppercase
                        tracking-[0.12em]

                        flex
                        items-center
                        gap-1
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
                        text-[8px]
                        sm:text-[9px]

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
                  </div>

                  <AnimatePresence mode="wait">
                    {isAddingCategory ? (
                      <motion.div
                        key="new-category"
                        initial={{
                          opacity: 0,
                          x: 8,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -8,
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
                              event.target
                                .value
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

                            h-9
                            sm:h-10

                            px-2.5

                            rounded-lg

                            bg-secondary

                            border
                            border-border

                            text-xs

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
                            w-9
                            h-9

                            sm:w-10
                            sm:h-10

                            shrink-0

                            bg-primary

                            rounded-lg

                            flex
                            items-center
                            justify-center

                            text-primary-foreground

                            border
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
                          x: -8,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: 8,
                        }}
                      >
                        <select
                          id="transaction-category"
                          required
                          value={
                            formData.categoryId
                          }
                          onChange={(event) =>
                            updateFormData(
                              'categoryId',
                              event.target
                                .value
                            )
                          }
                          disabled={
                            saving ||
                            filteredCategories.length ===
                              0
                          }
                          className="
                            w-full

                            h-9
                            sm:h-10

                            px-2.5

                            rounded-lg

                            bg-secondary

                            border
                            border-border

                            text-xs

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
                            {filteredCategories.length ===
                            0
                              ? `No ${formData.type.toLowerCase()} categories`
                              : 'Select Category'}
                          </option>

                          {filteredCategories.map(
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

                        {filteredCategories.length ===
                          0 && (
                          <p
                            className="
                              text-[8px]
                              text-amber-600
                              dark:text-amber-400
                              mt-0.5
                              px-0.5
                            "
                          >
                            Create a category
                            first.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* DATE */}

                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor="transaction-date"
                    className="
                      text-[8px]
                      sm:text-[9px]

                      font-bold
                      text-muted

                      uppercase
                      tracking-[0.12em]

                      px-0.5

                      flex
                      items-center
                      gap-1
                    "
                  >
                    <Calendar
                      className="
                        w-3
                        h-3
                      "
                      aria-hidden="true"
                    />

                    Date
                  </label>

                  <input
                    id="transaction-date"
                    type="date"
                    required
                    value={
                      formData.transactionDate
                    }
                    onChange={(event) =>
                      updateFormData(
                        'transactionDate',
                        event.target
                          .value
                      )
                    }
                    disabled={saving}
                    className="
                      w-full

                      h-9
                      sm:h-10

                      px-2.5

                      rounded-lg

                      bg-secondary

                      border
                      border-border

                      text-xs

                      text-foreground

                      outline-none

                      focus:border-primary

                      focus:ring-2
                      focus:ring-primary/10

                      transition-all

                      font-medium

                      disabled:opacity-50
                    "
                  />
                </div>
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div className="space-y-1">
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    px-0.5
                  "
                >
                  <label
                    htmlFor="transaction-description"
                    className="
                      text-[8px]
                      sm:text-[9px]

                      font-bold
                      text-muted

                      uppercase
                      tracking-[0.12em]

                      flex
                      items-center
                      gap-1
                    "
                  >
                    <Info
                      className="
                        w-3
                        h-3
                      "
                      aria-hidden="true"
                    />

                    Description
                  </label>

                  <span
                    className="
                      text-[8px]
                      sm:text-[9px]

                      text-muted
                      font-medium
                    "
                  >
                    {
                      formData.description
                        .length
                    }
                    /255
                  </span>
                </div>

                <input
                  id="transaction-description"
                  type="text"
                  maxLength={255}
                  placeholder="What was this for?"
                  value={
                    formData.description
                  }
                  onChange={(event) =>
                    updateFormData(
                      'description',
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="
                    w-full

                    h-9
                    sm:h-10

                    px-2.5

                    rounded-lg

                    bg-secondary

                    border
                    border-border

                    text-xs

                    font-medium

                    text-foreground

                    outline-none

                    placeholder:text-muted/50

                    focus:border-primary

                    focus:ring-2
                    focus:ring-primary/10

                    transition-all

                    disabled:opacity-50
                  "
                />
              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div
                className="
                  pt-0.5
                  pb-0

                  space-y-1
                "
              >
                <button
                  type="submit"
                  disabled={
                    saving ||
                    addingCategory ||
                    filteredCategories.length ===
                      0
                  }
                  className="
                    w-full

                    btn-primary

                    h-9
                    sm:h-10

                    px-3

                    rounded-lg

                    text-[11px]
                    sm:text-xs

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

                      Saving...
                    </>
                  ) : (
                    <>
                      {isIncome ? (
                        <Plus
                          className="
                            w-3.5
                            h-3.5
                          "
                          aria-hidden="true"
                        />
                      ) : (
                        <Minus
                          className="
                            w-3.5
                            h-3.5
                          "
                          aria-hidden="true"
                        />
                      )}

                      Add Transaction
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

                    h-7
                    sm:h-8

                    text-[9px]
                    sm:text-[10px]

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
