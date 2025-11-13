const processPaymentInstruction = require('./services/payment-instruction/process-payment-instruction');

const testCases = [
  {
    name: 'Test 1 - DEBIT format (successful)',
    input: {
      accounts: [
        { id: 'N90394', balance: 1000, currency: 'USD' },
        { id: 'N9122', balance: 500, currency: 'USD' },
      ],
      instruction: 'DEBIT 500 USD FROM ACCOUNT N90394 FOR CREDIT TO ACCOUNT N9122',
    },
    expected: { status: 'successful', statusCode: 'AP00' },
  },
  {
    name: 'Test 2 - CREDIT format with future date (pending)',
    input: {
      accounts: [
        { id: 'acc-001', balance: 1000, currency: 'NGN' },
        { id: 'acc-002', balance: 500, currency: 'NGN' },
      ],
      instruction: 'CREDIT 300 NGN TO ACCOUNT acc-002 FOR DEBIT FROM ACCOUNT acc-001 ON 2026-12-31',
    },
    expected: { status: 'pending', statusCode: 'AP02' },
  },
  {
    name: 'Test 3 - Case insensitive keywords',
    input: {
      accounts: [
        { id: 'a', balance: 500, currency: 'GBP' },
        { id: 'b', balance: 200, currency: 'GBP' },
      ],
      instruction: 'debit 100 gbp from account a for credit to account b',
    },
    expected: { status: 'successful', statusCode: 'AP00' },
  },
  {
    name: 'Test 4 - Past date (immediate execution)',
    input: {
      accounts: [
        { id: 'x', balance: 500, currency: 'NGN' },
        { id: 'y', balance: 200, currency: 'NGN' },
      ],
      instruction: 'DEBIT 100 NGN FROM ACCOUNT x FOR CREDIT TO ACCOUNT y ON 2024-01-15',
    },
    expected: { status: 'successful', statusCode: 'AP00' },
  },
  {
    name: 'Test 5 - Currency mismatch (error)',
    input: {
      accounts: [
        { id: 'a', balance: 100, currency: 'USD' },
        { id: 'b', balance: 500, currency: 'GBP' },
      ],
      instruction: 'DEBIT 50 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b',
    },
    expected: { status: 'failed', statusCode: 'CU01' },
  },
  {
    name: 'Test 6 - Insufficient funds (error)',
    input: {
      accounts: [
        { id: 'a', balance: 100, currency: 'USD' },
        { id: 'b', balance: 500, currency: 'USD' },
      ],
      instruction: 'DEBIT 500 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b',
    },
    expected: { status: 'failed', statusCode: 'AC01' },
  },
  {
    name: 'Test 7 - Unsupported currency (error)',
    input: {
      accounts: [
        { id: 'a', balance: 100, currency: 'EUR' },
        { id: 'b', balance: 500, currency: 'EUR' },
      ],
      instruction: 'DEBIT 50 EUR FROM ACCOUNT a FOR CREDIT TO ACCOUNT b',
    },
    expected: { status: 'failed', statusCode: 'CU02' },
  },
  {
    name: 'Test 8 - Same account (error)',
    input: {
      accounts: [{ id: 'a', balance: 500, currency: 'USD' }],
      instruction: 'DEBIT 100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT a',
    },
    expected: { status: 'failed', statusCode: 'AC02' },
  },
  {
    name: 'Test 9 - Negative amount (error)',
    input: {
      accounts: [
        { id: 'a', balance: 500, currency: 'USD' },
        { id: 'b', balance: 200, currency: 'USD' },
      ],
      instruction: 'DEBIT -100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b',
    },
    expected: { status: 'failed', statusCode: 'AM01' },
  },
  {
    name: 'Test 10 - Account not found (error)',
    input: {
      accounts: [{ id: 'a', balance: 500, currency: 'USD' }],
      instruction: 'DEBIT 100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT xyz',
    },
    expected: { status: 'failed', statusCode: 'AC03' },
  },
  {
    name: 'Test 11 - Decimal amount (error)',
    input: {
      accounts: [
        { id: 'a', balance: 500, currency: 'USD' },
        { id: 'b', balance: 200, currency: 'USD' },
      ],
      instruction: 'DEBIT 100.50 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b',
    },
    expected: { status: 'failed', statusCode: 'AM01' },
  },
  {
    name: 'Test 12 - Malformed instruction (error)',
    input: {
      accounts: [
        { id: 'a', balance: 500, currency: 'USD' },
        { id: 'b', balance: 200, currency: 'USD' },
      ],
      instruction: 'SEND 100 USD TO ACCOUNT b',
    },
    expected: { status: 'failed', statusCode: 'SY03' },
  },
];

async function runTests() {
  console.log('Running Payment Instruction Tests...\n');

  let passed = 0;
  let failed = 0;

  const results = await Promise.all(
    testCases.map((testCase) =>
      processPaymentInstruction(testCase.input).catch((error) => ({ error }))
    )
  );

  results.forEach((result, index) => {
    const testCase = testCases[index];
    try {
      if (result.error) {
        console.log(`✗ ${testCase.name} - ERROR`);
        console.log(`  ${result.error.message}`);
        failed += 1;
      } else {
        const statusMatch = result.status === testCase.expected.status;
        const codeMatch = result.status_code === testCase.expected.statusCode;

        if (statusMatch && codeMatch) {
          console.log(`✓ ${testCase.name}`);
          console.log(`  Status: ${result.status}, Code: ${result.status_code}`);
          passed += 1;
        } else {
          console.log(`✗ ${testCase.name}`);
          console.log(`  Expected: ${testCase.expected.status} (${testCase.expected.statusCode})`);
          console.log(`  Got: ${result.status} (${result.status_code})`);
          console.log(`  Full result:`, JSON.stringify(result, null, 2));
          failed += 1;
        }
      }
    } catch (error) {
      console.log(`✗ ${testCase.name} - ERROR`);
      console.log(`  ${error.message}`);
      failed += 1;
    }
    console.log('');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
}

runTests().catch(console.error);
