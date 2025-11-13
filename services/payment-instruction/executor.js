const messages = require('@app/messages/payment-instruction');

/**
 * Compares a date string with current UTC date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {number} -1 if past, 0 if today, 1 if future
 */
function compareDateWithToday(dateStr) {
  if (!dateStr) {
    return -1;
  }

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentDay = now.getUTCDate();

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(5, 7), 10);
  const day = parseInt(dateStr.substring(8, 10), 10);

  if (year > currentYear) return 1;
  if (year < currentYear) return -1;

  if (month > currentMonth) return 1;
  if (month < currentMonth) return -1;

  if (day > currentDay) return 1;
  if (day < currentDay) return -1;

  return 0;
}

/**
 * Determines if transaction should be executed immediately or pending
 * @param {string|null} executeBy - Execution date
 * @returns {{shouldExecute: boolean, status: string, statusCode: string, statusReason: string}} Execution decision
 */
function determineExecutionStatus(executeBy) {
  const comparison = compareDateWithToday(executeBy);

  if (comparison <= 0) {
    return {
      shouldExecute: true,
      status: 'successful',
      statusCode: 'AP00',
      statusReason: messages.AP00,
    };
  }
  return {
    shouldExecute: false,
    status: 'pending',
    statusCode: 'AP02',
    statusReason: messages.AP02,
  };
}

/**
 * Executes a transaction by updating account balances
 * @param {object} debitAccount - Debit account object
 * @param {object} creditAccount - Credit account object
 * @param {number} amount - Transaction amount
 * @returns {{debitAccount: object, creditAccount: object}} Updated accounts
 */
function executeTransaction(debitAccount, creditAccount, amount) {
  const updatedDebitAccount = {
    ...debitAccount,
    balance: debitAccount.balance - amount,
  };

  const updatedCreditAccount = {
    ...creditAccount,
    balance: creditAccount.balance + amount,
  };

  return {
    debitAccount: updatedDebitAccount,
    creditAccount: updatedCreditAccount,
  };
}

/**
 * Main executor function
 * @param {object} parsedInstruction - Parsed instruction data
 * @param {object} debitAccount - Debit account object
 * @param {object} creditAccount - Credit account object
 * @returns {object} Execution result
 */
function executeInstruction(parsedInstruction, debitAccount, creditAccount) {
  const { amount, executeBy } = parsedInstruction;

  const executionStatus = determineExecutionStatus(executeBy);

  let finalDebitAccount = debitAccount;
  let finalCreditAccount = creditAccount;

  if (executionStatus.shouldExecute) {
    const result = executeTransaction(debitAccount, creditAccount, amount);
    finalDebitAccount = result.debitAccount;
    finalCreditAccount = result.creditAccount;
  }

  return {
    status: executionStatus.status,
    statusCode: executionStatus.statusCode,
    statusReason: executionStatus.statusReason,
    debitAccount: finalDebitAccount,
    creditAccount: finalCreditAccount,
  };
}

module.exports = {
  executeInstruction,
  compareDateWithToday,
};
