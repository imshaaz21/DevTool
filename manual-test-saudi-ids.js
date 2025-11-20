// Simple manual test for Saudi ID generation
// Copy and paste this into your browser console to test

// Luhn checksum calculator
function calculateLuhnChecksum(digits) {
    let sum = 0;

    for (let i = 0; i < 9; i++) {
        if (i % 2 === 0) {
            let product = digits[i] * 2;
            if (product > 9) {
                sum += product - 9;
            } else {
                sum += product;
            }
        } else {
            sum += digits[i];
        }
    }

    let checksum = 10 - (sum % 10);
    if (checksum === 10) checksum = 0;

    return checksum;
}

// Generate Saudi NID
function generateSaudiNID() {
    const firstDigit = 1;
    const first9Digits = [firstDigit];

    for (let i = 1; i < 9; i++) {
        first9Digits.push(Math.floor(Math.random() * 10));
    }

    const checksum = calculateLuhnChecksum(first9Digits);
    return first9Digits.join('') + checksum;
}

// Generate Iqama ID
function generateIqamaID() {
    const firstDigit = 2;
    const first9Digits = [firstDigit];

    for (let i = 1; i < 9; i++) {
        first9Digits.push(Math.floor(Math.random() * 10));
    }

    const checksum = calculateLuhnChecksum(first9Digits);
    return first9Digits.join('') + checksum;
}

// Validate checksum
function validateLuhnChecksum(id) {
    if (id.length !== 10) return false;

    const digits = id.split('').map(Number);
    const providedChecksum = digits[9];
    const calculatedChecksum = calculateLuhnChecksum(digits.slice(0, 9));

    return providedChecksum === calculatedChecksum;
}

console.log('=== Testing Saudi ID Generation ===\n');

// Test Saudi NIDs
console.log('Saudi NIDs (should start with 1):');
for (let i = 0; i < 10; i++) {
    const nid = generateSaudiNID();
    const valid = validateLuhnChecksum(nid);
    console.log(`${nid} - Valid: ${valid}`);
}

console.log('\nIqama IDs (should start with 2):');
for (let i = 0; i < 10; i++) {
    const iqama = generateIqamaID();
    const valid = validateLuhnChecksum(iqama);
    console.log(`${iqama} - Valid: ${valid}`);
}

console.log('\n=== Testing with Known Examples ===');
console.log('Testing your sample from the request:');
console.log('Expected format: 1XXXXXXXXC (starts with 1, ends with checksum)');
console.log('\nGenerate 5 Saudi NIDs:');
for (let i = 0; i < 5; i++) {
    console.log(generateSaudiNID());
}
