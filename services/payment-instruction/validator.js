const messages = require('@app/messages/payment-instruction');

/**
 * Validates that currency is supported
 * @param {string} currency - Currency code
 * @returns {{valid: boolean, error: object|null}} Validation result
 */
function validateCurrencySupport(currency) {
  if (!messages.SUPPORTED_CURRENCIES.includes(currency)) {
    return {
      valid: false,
      error: { code: 'CU02', message: messages.CU02 },
    };
  }

  return { valid: true, error: null };
}

/**
 * Finds an account by ID in the accounts array
 * @param {Array} accounts - Array of account objects
 * @param {string} accountId - Account ID to find
 * @returns {object|null} Account object or null if not found
 */
function findAccount(accounts, accountId) {
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].id === accountId) {
      return accounts[i];
    }
  }
  return null;
}

/**
 * Validates that an account exists
 * @param {Array} accounts - Array of account objects
 * @param {string} accountId - Account ID to validate
 * @returns {{valid: boolean, error: object|null, account: object|null}} Validation result
 */
function validateAccountExists(accounts, accountId) {
  const account = findAccount(accounts, accountId);

  if (!account) {
    return {
      valid: false,
      error: { code: 'AC03', message: `${messages.AC03}: ${accountId}` },
      account: null,
    };
  }

  return { valid: true, error: null, account };
}

/**
 * Validates that debit and credit accounts are different
 * @param {string} debitAccountId - Debit account ID
 * @param {string} creditAccountId - Credit account ID
 * @returns {{valid: boolean, error: object|null}} Validation result
 */
function validateAccountsAreDifferent(debitAccountId, creditAccountId) {
  if (debitAccountId === creditAccountId) {
    return {
      valid: false,
      error: { code: 'AC02', message: messages.AC02 },
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that account currencies match the transaction currency
 * @param {object} debitAccount - Debit account object
 * @param {object} creditAccount - Credit account object
 * @param {string} transactionCurrency - Transaction currency
 * @returns {{valid: boolean, error: object|null}} Validation result
 */
function validateCurrencyMatch(debitAccount, creditAccount, transactionCurrency) {
  const debitCurrency = debitAccount.currency.toUpperCase();
  const creditCurrency = creditAccount.currency.toUpperCase();
  const txnCurrency = transactionCurrency.toUpperCase();

  if (debitCurrency !== txnCurrency || creditCurrency !== txnCurrency) {
    return {
      valid: false,
      error: {
        code: 'CU01',
        message: `${messages.CU01}. Debit account: ${debitCurrency}, Credit account: ${creditCurrency}, Transaction: ${txnCurrency}`,
      },
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that debit account has sufficient funds
 * @param {object} debitAccount - Debit account object
 * @param {number} amount - Transaction amount
 * @returns {{valid: boolean, error: object|null}} Validation result
 */
function validateSufficientFunds(debitAccount, amount) {
  if (debitAccount.balance < amount) {
    return {
      valid: false,
      error: {
        code: 'AC01',
        message: `${messages.AC01}. Account ${debitAccount.id} has ${debitAccount.balance} ${debitAccount.currency}, needs ${amount} ${debitAccount.currency}`,
      },
    };
  }

  return { valid: true, error: null };
}

/**
 * Main validation function
 * @param {object} parsedInstruction - Parsed instruction data
 * @param {Array} accounts - Array of account objects
 * @returns {{valid: boolean, error: object|null, debitAccount: object|null, creditAccount: object|null}} Validation result
 */
function validateInstruction(parsedInstruction, accounts) {
  const {
    amount,
    currency,
    debitAccount: debitAccountId,
    creditAccount: creditAccountId,
  } = parsedInstruction;

  const currencyValidation = validateCurrencySupport(currency);
  if (!currencyValidation.valid) {
    return {
      valid: false,
      error: currencyValidation.error,
      debitAccount: null,
      creditAccount: null,
    };
  }

  const accountsDifferentValidation = validateAccountsAreDifferent(debitAccountId, creditAccountId);
  if (!accountsDifferentValidation.valid) {
    return {
      valid: false,
      error: accountsDifferentValidation.error,
      debitAccount: null,
      creditAccount: null,
    };
  }

  const debitAccountValidation = validateAccountExists(accounts, debitAccountId);
  if (!debitAccountValidation.valid) {
    return {
      valid: false,
      error: debitAccountValidation.error,
      debitAccount: null,
      creditAccount: null,
    };
  }

  const creditAccountValidation = validateAccountExists(accounts, creditAccountId);
  if (!creditAccountValidation.valid) {
    return {
      valid: false,
      error: creditAccountValidation.error,
      debitAccount: null,
      creditAccount: null,
    };
  }

  const debitAccount = debitAccountValidation.account;
  const creditAccount = creditAccountValidation.account;

  const currencyMatchValidation = validateCurrencyMatch(debitAccount, creditAccount, currency);
  if (!currencyMatchValidation.valid) {
    return { valid: false, error: currencyMatchValidation.error, debitAccount, creditAccount };
  }

  // Validate sufficient funds
  const fundsValidation = validateSufficientFunds(debitAccount, amount);
  if (!fundsValidation.valid) {
    return { valid: false, error: fundsValidation.error, debitAccount, creditAccount };
  }

  return { valid: true, error: null, debitAccount, creditAccount };
}

module.exports = {
  validateInstruction,
  findAccount,
};
