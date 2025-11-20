/**
 * Test Script for Saudi ID Generation and Validation
 * 
 * This script tests the Saudi NID and Iqama ID generation and validation functions
 * to ensure they follow the correct format and use proper Luhn checksums.
 */

import {
    generateSaudiNID,
    generateIqamaID,
    validateSaudiNID,
    validateIqamaID,
    validateLuhnChecksum
} from './saudiDataGenerator';

console.log('=== Testing Saudi NID and Iqama ID Generation ===\n');

// Test 1: Generate 10 Saudi NIDs
console.log('Test 1: Generating 10 Saudi NIDs...');
console.log('Expected: All IDs should start with "1" and have valid checksums\n');

let allNIDsValid = true;
for (let i = 0; i < 10; i++) {
    const nid = generateSaudiNID();
    const isValid = validateSaudiNID(nid);
    const startsWithOne = nid.startsWith('1');
    const hasValidChecksum = validateLuhnChecksum(nid);

    console.log(`${i + 1}. ${nid} - Valid: ${isValid}, Starts with 1: ${startsWithOne}, Checksum Valid: ${hasValidChecksum}`);

    if (!isValid || !startsWithOne || !hasValidChecksum) {
        allNIDsValid = false;
    }
}

console.log(`\n✓ All NIDs Valid: ${allNIDsValid}\n`);

// Test 2: Generate 10 Iqama IDs
console.log('Test 2: Generating 10 Iqama IDs...');
console.log('Expected: All IDs should start with "2" and have valid checksums\n');

let allIqamasValid = true;
for (let i = 0; i < 10; i++) {
    const iqama = generateIqamaID();
    const isValid = validateIqamaID(iqama);
    const startsWithTwo = iqama.startsWith('2');
    const hasValidChecksum = validateLuhnChecksum(iqama);

    console.log(`${i + 1}. ${iqama} - Valid: ${isValid}, Starts with 2: ${startsWithTwo}, Checksum Valid: ${hasValidChecksum}`);

    if (!isValid || !startsWithTwo || !hasValidChecksum) {
        allIqamasValid = false;
    }
}

console.log(`\n✓ All Iqamas Valid: ${allIqamasValid}\n`);

// Test 3: Validate known valid IDs (from your sample code)
console.log('Test 3: Testing validation with known valid/invalid IDs...\n');

// Generate a valid Saudi NID
const validNID = generateSaudiNID();
console.log(`Valid Saudi NID: ${validNID} - Validation: ${validateSaudiNID(validNID)}`);

// Generate a valid Iqama ID
const validIqama = generateIqamaID();
console.log(`Valid Iqama ID: ${validIqama} - Validation: ${validateIqamaID(validIqama)}`);

// Invalid IDs
const invalidNID1 = '9123456789'; // Starts with 9 (old format)
const invalidNID2 = '1234567890'; // Invalid checksum
const invalidIqama1 = '8123456789'; // Starts with 8 (old format)
const invalidIqama2 = '2234567890'; // Invalid checksum

console.log(`\nInvalid NID (starts with 9): ${invalidNID1} - Validation: ${validateSaudiNID(invalidNID1)}`);
console.log(`Invalid NID (bad checksum): ${invalidNID2} - Validation: ${validateSaudiNID(invalidNID2)}`);
console.log(`Invalid Iqama (starts with 8): ${invalidIqama1} - Validation: ${validateIqamaID(invalidIqama1)}`);
console.log(`Invalid Iqama (bad checksum): ${invalidIqama2} - Validation: ${validateIqamaID(invalidIqama2)}`);

// Test 4: Summary
console.log('\n=== Test Summary ===');
console.log(`Saudi NIDs: ${allNIDsValid ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Iqama IDs: ${allIqamasValid ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Overall: ${allNIDsValid && allIqamasValid ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
