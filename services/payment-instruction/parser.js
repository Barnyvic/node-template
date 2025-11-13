const messages = require('@app/messages/payment-instruction');

/**
 * Normalizes whitespace in instruction string
 * @param {string} instruction - Raw instruction string
 * @returns {string} Normalized instruction
 */
function normalizeWhitespace(instruction) {
  if (!instruction || typeof instruction !== 'string') {
    return '';
  }

  const normalized = instruction.trim();

  let result = '';
  let lastWasSpace = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charAt(i);
    const isSpace = char === ' ' || char === '\t' || char === '\n' || char === '\r';

    if (isSpace) {
      if (!lastWasSpace) {
        result += ' ';
        lastWasSpace = true;
      }
    } else {
      result += char;
      lastWasSpace = false;
    }
  }

  return result;
}

/**
 * Finds the index of a keyword in the instruction (case-insensitive)
 * @param {string} instruction - Instruction string
 * @param {string} keyword - Keyword to find
 * @param {number} startFrom - Start searching from this index
 * @returns {number} Index of keyword or -1 if not found
 */
function findKeywordIndex(instruction, keyword, startFrom = 0) {
  const lowerInstruction = instruction.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  return lowerInstruction.indexOf(lowerKeyword, startFrom);
}

/**
 * Extracts a value between two positions
 * @param {string} instruction - Instruction string
 * @param {number} startPos - Start position
 * @param {number} endPos - End position
 * @returns {string} Extracted value
 */
function extractValue(instruction, startPos, endPos) {
  if (endPos === -1) {
    return instruction.substring(startPos).trim();
  }
  return instruction.substring(startPos, endPos).trim();
}

/**
 * Parses amount and currency from a string
 * @param {string} valueStr - String containing amount and currency
 * @returns {{amount: number|null, currency: string|null}} Parsed values
 */
function parseAmountAndCurrency(valueStr) {
  const parts = valueStr.trim().split(' ');

  if (parts.length < 2) {
    return { amount: null, currency: null };
  }

  const amountStr = parts[0];
  const currencyStr = parts[1].toUpperCase();

  const amount = parseInt(amountStr, 10);

  if (
    Number.isNaN(amount) ||
    amount <= 0 ||
    amountStr.indexOf('.') !== -1 ||
    amountStr.indexOf('-') !== -1
  ) {
    return { amount: null, currency: null };
  }

  if (amount.toString() !== amountStr) {
    return { amount: null, currency: null };
  }

  return { amount, currency: currencyStr };
}

/**
 * Extracts account ID from a string after "ACCOUNT" keyword
 * @param {string} valueStr - String containing account ID
 * @returns {string|null} Account ID or null
 */
function extractAccountId(valueStr) {
  const parts = valueStr.trim().split(' ');

  if (parts.length === 0) {
    return null;
  }

  return parts[0];
}

/**
 * Validates account ID format (letters, numbers, hyphens, periods, at symbols only)
 * @param {string} accountId - Account ID to validate
 * @returns {boolean} True if valid
 */
function isValidAccountIdFormat(accountId) {
  if (!accountId || typeof accountId !== 'string') {
    return false;
  }

  for (let i = 0; i < accountId.length; i++) {
    const char = accountId.charAt(i);
    const isValid =
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      (char >= '0' && char <= '9') ||
      char === '-' ||
      char === '.' ||
      char === '@';

    if (!isValid) {
      return false;
    }
  }

  return true;
}

/**
 * Validates date format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid
 */
function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.length !== 10) {
    return false;
  }

  if (dateStr.charAt(4) !== '-' || dateStr.charAt(7) !== '-') {
    return false;
  }

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(5, 7);
  const day = dateStr.substring(8, 10);

  for (let i = 0; i < year.length; i++) {
    if (year.charAt(i) < '0' || year.charAt(i) > '9') return false;
  }
  for (let i = 0; i < month.length; i++) {
    if (month.charAt(i) < '0' || month.charAt(i) > '9') return false;
  }
  for (let i = 0; i < day.length; i++) {
    if (day.charAt(i) < '0' || day.charAt(i) > '9') return false;
  }

  return true;
}

/**
 * Parses DEBIT format instruction
 * Format: DEBIT [amount] [currency] FROM ACCOUNT [id] FOR CREDIT TO ACCOUNT [id] [ON [date]]
 * @param {string} instruction - Normalized instruction string
 * @returns {object} Parsed instruction data
 */
function parseDebitInstruction(instruction) {
  const result = {
    type: 'DEBIT',
    amount: null,
    currency: null,
    debitAccount: null,
    creditAccount: null,
    executeBy: null,
    error: null,
  };

  const debitPos = findKeywordIndex(instruction, 'DEBIT');
  const fromPos = findKeywordIndex(instruction, 'FROM');
  const accountPos1 = findKeywordIndex(instruction, 'ACCOUNT', fromPos);
  const forPos = findKeywordIndex(instruction, 'FOR');
  const creditPos = findKeywordIndex(instruction, 'CREDIT', forPos);
  const toPos = findKeywordIndex(instruction, 'TO', creditPos);
  const accountPos2 = findKeywordIndex(instruction, 'ACCOUNT', toPos);
  const onPos = findKeywordIndex(instruction, 'ON', accountPos2);

  if (
    debitPos === -1 ||
    fromPos === -1 ||
    accountPos1 === -1 ||
    forPos === -1 ||
    creditPos === -1 ||
    toPos === -1 ||
    accountPos2 === -1
  ) {
    result.error = { code: 'SY01', message: messages.SY01 };
    return result;
  }

  if (
    !(
      debitPos < fromPos &&
      fromPos < accountPos1 &&
      accountPos1 < forPos &&
      forPos < creditPos &&
      creditPos < toPos &&
      toPos < accountPos2
    )
  ) {
    result.error = { code: 'SY02', message: messages.SY02 };
    return result;
  }

  const amountCurrencyStr = extractValue(instruction, debitPos + 5, fromPos);
  const { amount, currency } = parseAmountAndCurrency(amountCurrencyStr);

  if (amount === null || currency === null) {
    result.error = { code: 'AM01', message: messages.AM01 };
    return result;
  }

  result.amount = amount;
  result.currency = currency;

  const debitAccountStr = extractValue(instruction, accountPos1 + 7, forPos);
  const debitAccount = extractAccountId(debitAccountStr);

  if (!debitAccount) {
    result.error = { code: 'SY03', message: messages.SY03 };
    return result;
  }

  if (!isValidAccountIdFormat(debitAccount)) {
    result.error = { code: 'AC04', message: messages.AC04 };
    return result;
  }

  result.debitAccount = debitAccount;

  const creditAccountStr = extractValue(instruction, accountPos2 + 7, onPos);
  const creditAccount = extractAccountId(creditAccountStr);

  if (!creditAccount) {
    result.error = { code: 'SY03', message: messages.SY03 };
    return result;
  }

  if (!isValidAccountIdFormat(creditAccount)) {
    result.error = { code: 'AC04', message: messages.AC04 };
    return result;
  }

  result.creditAccount = creditAccount;

  if (onPos !== -1) {
    const dateStr = extractValue(instruction, onPos + 2, -1).trim();

    if (!isValidDateFormat(dateStr)) {
      result.error = { code: 'DT01', message: messages.DT01 };
      return result;
    }

    result.executeBy = dateStr;
  }

  return result;
}

/**
 * Parses CREDIT format instruction
 * Format: CREDIT [amount] [currency] TO ACCOUNT [id] FOR DEBIT FROM ACCOUNT [id] [ON [date]]
 * @param {string} instruction - Normalized instruction string
 * @returns {object} Parsed instruction data
 */
function parseCreditInstruction(instruction) {
  const result = {
    type: 'CREDIT',
    amount: null,
    currency: null,
    debitAccount: null,
    creditAccount: null,
    executeBy: null,
    error: null,
  };

  const creditPos = findKeywordIndex(instruction, 'CREDIT');
  const toPos = findKeywordIndex(instruction, 'TO');
  const accountPos1 = findKeywordIndex(instruction, 'ACCOUNT', toPos);
  const forPos = findKeywordIndex(instruction, 'FOR');
  const debitPos = findKeywordIndex(instruction, 'DEBIT', forPos);
  const fromPos = findKeywordIndex(instruction, 'FROM', debitPos);
  const accountPos2 = findKeywordIndex(instruction, 'ACCOUNT', fromPos);
  const onPos = findKeywordIndex(instruction, 'ON', accountPos2);

  if (
    creditPos === -1 ||
    toPos === -1 ||
    accountPos1 === -1 ||
    forPos === -1 ||
    debitPos === -1 ||
    fromPos === -1 ||
    accountPos2 === -1
  ) {
    result.error = { code: 'SY01', message: messages.SY01 };
    return result;
  }

  if (
    !(
      creditPos < toPos &&
      toPos < accountPos1 &&
      accountPos1 < forPos &&
      forPos < debitPos &&
      debitPos < fromPos &&
      fromPos < accountPos2
    )
  ) {
    result.error = { code: 'SY02', message: messages.SY02 };
    return result;
  }

  const amountCurrencyStr = extractValue(instruction, creditPos + 6, toPos);
  const { amount, currency } = parseAmountAndCurrency(amountCurrencyStr);

  if (amount === null || currency === null) {
    result.error = { code: 'AM01', message: messages.AM01 };
    return result;
  }

  result.amount = amount;
  result.currency = currency;

  const creditAccountStr = extractValue(instruction, accountPos1 + 7, forPos);
  const creditAccount = extractAccountId(creditAccountStr);

  if (!creditAccount) {
    result.error = { code: 'SY03', message: messages.SY03 };
    return result;
  }

  if (!isValidAccountIdFormat(creditAccount)) {
    result.error = { code: 'AC04', message: messages.AC04 };
    return result;
  }

  result.creditAccount = creditAccount;

  const debitAccountStr = extractValue(instruction, accountPos2 + 7, onPos);
  const debitAccount = extractAccountId(debitAccountStr);

  if (!debitAccount) {
    result.error = { code: 'SY03', message: messages.SY03 };
    return result;
  }

  if (!isValidAccountIdFormat(debitAccount)) {
    result.error = { code: 'AC04', message: messages.AC04 };
    return result;
  }

  result.debitAccount = debitAccount;

  if (onPos !== -1) {
    const dateStr = extractValue(instruction, onPos + 2, -1).trim();

    if (!isValidDateFormat(dateStr)) {
      result.error = { code: 'DT01', message: messages.DT01 };
      return result;
    }

    result.executeBy = dateStr;
  }

  return result;
}

/**
 * Main parser function
 * @param {string} instruction - Raw instruction string
 * @returns {object} Parsed instruction data
 */
function parseInstruction(instruction) {
  const normalized = normalizeWhitespace(instruction);

  if (!normalized) {
    return {
      type: null,
      amount: null,
      currency: null,
      debitAccount: null,
      creditAccount: null,
      executeBy: null,
      error: { code: 'SY03', message: messages.SY03 },
    };
  }

  const startsWithDebit = findKeywordIndex(normalized, 'DEBIT') === 0;
  const startsWithCredit = findKeywordIndex(normalized, 'CREDIT') === 0;

  if (startsWithDebit) {
    return parseDebitInstruction(normalized);
  }
  if (startsWithCredit) {
    return parseCreditInstruction(normalized);
  }
  return {
    type: null,
    amount: null,
    currency: null,
    debitAccount: null,
    creditAccount: null,
    executeBy: null,
    error: { code: 'SY03', message: messages.SY03 },
  };
}

module.exports = {
  parseInstruction,
  isValidAccountIdFormat,
  isValidDateFormat,
};
