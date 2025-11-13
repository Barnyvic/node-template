module.exports = {
  AP00: 'Transaction executed successfully',
  AP02: 'Transaction scheduled for future execution',

  AM01: 'Amount must be a positive integer',

  CU01: 'Account currency mismatch',
  CU02: 'Unsupported currency. Only NGN, USD, GBP, and GHS are supported',

  AC01: 'Insufficient funds in debit account',
  AC02: 'Debit and credit accounts cannot be the same',
  AC03: 'Account not found',
  AC04: 'Invalid account ID format',

  DT01: 'Invalid date format. Expected YYYY-MM-DD',

  SY01: 'Missing required keyword',
  SY02: 'Invalid keyword order',
  SY03: 'Malformed instruction: unable to parse keywords',

  SUPPORTED_CURRENCIES: ['NGN', 'USD', 'GBP', 'GHS'],

  KEYWORDS: {
    DEBIT: 'DEBIT',
    CREDIT: 'CREDIT',
    FROM: 'FROM',
    TO: 'TO',
    FOR: 'FOR',
    ACCOUNT: 'ACCOUNT',
    ON: 'ON',
  },
};
