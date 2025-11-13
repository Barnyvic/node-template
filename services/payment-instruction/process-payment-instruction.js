const messages = require('@app/messages/payment-instruction');
const { parseInstruction } = require('./parser');
const { validateInstruction, findAccount } = require('./validator');
const { executeInstruction } = require('./executor');

/**
 * Formats account object for response
 * @param {object} account - Account object
 * @param {number} balanceBefore - Original balance
 * @returns {object} Formatted account
 */
function formatAccountForResponse(account, balanceBefore) {
  return {
    id: account.id,
    balance: account.balance,
    balance_before: balanceBefore,
    currency: account.currency.toUpperCase(),
  };
}

/**
 * Builds response for unparseable instructions
 * @param {object} parseError - Parse error object
 * @returns {object} Response object
 */
function buildUnparseableResponse(parseError) {
  return {
    type: null,
    amount: null,
    currency: null,
    debit_account: null,
    credit_account: null,
    execute_by: null,
    status: 'failed',
    status_reason: parseError.message,
    status_code: parseError.code,
    accounts: [],
  };
}

/**
 * Builds response for validation errors
 * @param {object} parsedInstruction - Parsed instruction data
 * @param {object} validationError - Validation error object
 * @param {Array} originalAccounts - Original accounts array
 * @returns {object} Response object
 */
function buildValidationErrorResponse(parsedInstruction, validationError, originalAccounts) {
  const { type, amount, currency, debitAccount, creditAccount, executeBy } = parsedInstruction;

  // Find original accounts to include in response
  const debitAcc = findAccount(originalAccounts, debitAccount);
  const creditAcc = findAccount(originalAccounts, creditAccount);

  const accountsInResponse = [];

  for (let i = 0; i < originalAccounts.length; i++) {
    const acc = originalAccounts[i];
    if (acc.id === debitAccount || acc.id === creditAccount) {
      accountsInResponse.push(formatAccountForResponse(acc, acc.balance));
    }
  }

  return {
    type,
    amount,
    currency: currency ? currency.toUpperCase() : null,
    debit_account: debitAccount,
    credit_account: creditAccount,
    execute_by: executeBy,
    status: 'failed',
    status_reason: validationError.message,
    status_code: validationError.code,
    accounts: accountsInResponse,
  };
}

/**
 * Builds response for successful execution
 * @param {object} parsedInstruction - Parsed instruction data
 * @param {object} executionResult - Execution result
 * @param {Array} originalAccounts - Original accounts array
 * @returns {object} Response object
 */
function buildSuccessResponse(parsedInstruction, executionResult, originalAccounts) {
  const { type, amount, currency, debitAccount, creditAccount, executeBy } = parsedInstruction;
  const {
    status,
    statusCode,
    statusReason,
    debitAccount: updatedDebit,
    creditAccount: updatedCredit,
  } = executionResult;

  const originalDebit = findAccount(originalAccounts, debitAccount);
  const originalCredit = findAccount(originalAccounts, creditAccount);

  const accountsInResponse = [];

  for (let i = 0; i < originalAccounts.length; i++) {
    const acc = originalAccounts[i];
    if (acc.id === debitAccount) {
      accountsInResponse.push(formatAccountForResponse(updatedDebit, originalDebit.balance));
    } else if (acc.id === creditAccount) {
      accountsInResponse.push(formatAccountForResponse(updatedCredit, originalCredit.balance));
    }
  }

  return {
    type,
    amount,
    currency: currency.toUpperCase(),
    debit_account: debitAccount,
    credit_account: creditAccount,
    execute_by: executeBy,
    status,
    status_reason: statusReason,
    status_code: statusCode,
    accounts: accountsInResponse,
  };
}

/**
 * Main processing function
 * @param {object} serviceData - Service input data
 * @param {Array} serviceData.accounts - Array of account objects
 * @param {string} serviceData.instruction - Payment instruction string
 * @returns {object} Processing result
 */
async function processPaymentInstruction(serviceData) {
  const { accounts, instruction } = serviceData;

  const parsedInstruction = parseInstruction(instruction);

  if (parsedInstruction.error) {
    return buildUnparseableResponse(parsedInstruction.error);
  }

  const validationResult = validateInstruction(parsedInstruction, accounts);

  if (!validationResult.valid) {
    return buildValidationErrorResponse(parsedInstruction, validationResult.error, accounts);
  }

  const executionResult = executeInstruction(
    parsedInstruction,
    validationResult.debitAccount,
    validationResult.creditAccount
  );

  return buildSuccessResponse(parsedInstruction, executionResult, accounts);
}

module.exports = processPaymentInstruction;
