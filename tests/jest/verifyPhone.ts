
import { formatToE164, isValidPhone, getPhoneQueryVariations } from '../lib/phoneUtils';

console.log('--- Verifying Phone Utils ---');

const testCases = [
    { input: '(63) 98420-7313', expectedE164: '+5563984207313' },
    { input: '63984207313', expectedE164: '+5563984207313' },
    { input: '5563984207313', expectedE164: '+5563984207313' },
    { input: '123', expectedE164: null }
];

let failed = false;

testCases.forEach(({ input, expectedE164 }) => {
    const result = formatToE164(input);
    if (result !== expectedE164) {
        console.error(`[FAIL] formatToE164(${input}): Expected ${expectedE164}, got ${result}`);
        failed = true;
    } else {
        console.log(`[PASS] formatToE164(${input}) -> ${result}`);
    }
});

const variations = getPhoneQueryVariations('(63) 98420-7313');
console.log('Variations for (63) 98420-7313:', variations);
if (!variations.includes('+5563984207313') || !variations.includes('63984207313')) {
    console.error('[FAIL] Missing expected variations');
    failed = true;
} else {
    console.log('[PASS] Variations look correct');
}

if (failed) {
    console.error('--- TESTS FAILED ---');
    process.exit(1);
} else {
    console.log('--- ALL TESTS PASSED ---');
}
