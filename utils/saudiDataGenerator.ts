/**
 * Saudi Fake Data Generator Utilities
 * 
 * This file contains utility functions for generating fake data for Saudi and non-Saudi individuals.
 * All generated IDs follow the Saudi ID format with Luhn algorithm checksum validation.
 */

/**
 * Calculate Luhn algorithm checksum for a 9-digit array
 * @param digits Array of 9 digits
 * @returns The checksum digit (0-9)
 */
function calculateLuhnChecksum(digits: number[]): number {
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    if (i % 2 === 0) {
      // Double every even-indexed digit (0, 2, 4, 6, 8)
      let product = digits[i] * 2;
      if (product > 9) {
        sum += product - 9; // Subtract 9 if product is greater than 9
      } else {
        sum += product;
      }
    } else {
      // Add odd-indexed digits as-is
      sum += digits[i];
    }
  }
  
  let checksum = 10 - (sum % 10);
  if (checksum === 10) checksum = 0;
  
  return checksum;
}

/**
 * Validate a 10-digit ID using the Luhn algorithm
 * @param id The 10-digit ID string
 * @returns True if the checksum is valid
 */
export function validateLuhnChecksum(id: string): boolean {
  if (id.length !== 10 || !/^\d{10}$/.test(id)) {
    return false;
  }
  
  const digits = id.split('').map(Number);
  const providedChecksum = digits[9];
  const calculatedChecksum = calculateLuhnChecksum(digits.slice(0, 9));
  
  return providedChecksum === calculatedChecksum;
}

// Generate a random Saudi National ID (10 digits, starting with 1, with Luhn checksum)
export function generateSaudiNID(): string {
  const firstDigit = 1; // Saudi NID must start with 1
  const first9Digits: number[] = [firstDigit];
  
  // Generate 8 random digits (positions 1-8)
  for (let i = 1; i < 9; i++) {
    first9Digits.push(Math.floor(Math.random() * 10));
  }
  
  // Calculate and append the Luhn checksum
  const checksum = calculateLuhnChecksum(first9Digits);
  
  return first9Digits.join('') + checksum;
}

// Generate a random Iqama ID (10 digits, starting with 2, with Luhn checksum)
export function generateIqamaID(): string {
  const firstDigit = 2; // Iqama ID must start with 2
  const first9Digits: number[] = [firstDigit];
  
  // Generate 8 random digits (positions 1-8)
  for (let i = 1; i < 9; i++) {
    first9Digits.push(Math.floor(Math.random() * 10));
  }
  
  // Calculate and append the Luhn checksum
  const checksum = calculateLuhnChecksum(first9Digits);
  
  return first9Digits.join('') + checksum;
}

/**
 * Validate a Saudi National ID
 * @param id The 10-digit Saudi NID string
 * @returns True if the ID is valid (starts with 1 and has valid checksum)
 */
export function validateSaudiNID(id: string): boolean {
  if (!id || id.length !== 10 || !/^1\d{9}$/.test(id)) {
    return false;
  }
  return validateLuhnChecksum(id);
}

/**
 * Validate an Iqama ID
 * @param id The 10-digit Iqama ID string
 * @returns True if the ID is valid (starts with 2 and has valid checksum)
 */
export function validateIqamaID(id: string): boolean {
  if (!id || id.length !== 10 || !/^2\d{9}$/.test(id)) {
    return false;
  }
  return validateLuhnChecksum(id);
}

// Generate a random Passport ID (XX + 7 alphanumeric characters)
export function generatePassportID(): string {
  const countries = ['US', 'UK', 'FR', 'DE', 'IN', 'CN', 'JP', 'BR', 'EG', 'PK'];
  const country = countries[Math.floor(Math.random() * countries.length)];

  let id = country;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 7; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Generate a random Saudi phone number (starting with 05)
export function generateSaudiPhoneNumber(): string {
  let phone = '05';
  for (let i = 0; i < 8; i++) {
    phone += Math.floor(Math.random() * 10);
  }
  return phone;
}

// Generate a random date of birth (between 18 and 70 years ago)
export function generateDateOfBirth(): string {
  const now = new Date();
  const minAge = 18;
  const maxAge = 70;

  const minYear = now.getFullYear() - maxAge;
  const maxYear = now.getFullYear() - minAge;

  const year = minYear + Math.floor(Math.random() * (maxYear - minYear));
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28); // Using 28 to avoid invalid dates

  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Arabic names (sample data - in a real app, would use a more comprehensive dataset)
const arabicFirstNames = {
  male: ['محمد', 'أحمد', 'عبدالله', 'سعود', 'فهد', 'خالد', 'عبدالعزيز', 'سلمان', 'عمر', 'علي'],
  female: ['نورة', 'سارة', 'فاطمة', 'عائشة', 'منيرة', 'هيا', 'الجوهرة', 'ريم', 'لطيفة', 'مها']
};

const arabicSecondNames = {
  male: ['عبدالرحمن', 'عبدالعزيز', 'عبدالله', 'سلطان', 'فيصل', 'ناصر', 'سعد', 'بندر', 'تركي', 'ماجد'],
  female: ['محمد', 'عبدالله', 'عبدالرحمن', 'سعود', 'فهد', 'خالد', 'عبدالعزيز', 'سلمان', 'عمر', 'علي']
};

const arabicThirdNames = {
  male: ['سعود', 'فهد', 'خالد', 'ناصر', 'سعد', 'بندر', 'تركي', 'ماجد', 'فيصل', 'عادل'],
  female: ['سعود', 'فهد', 'خالد', 'ناصر', 'سعد', 'بندر', 'تركي', 'ماجد', 'فيصل', 'عادل']
};

const arabicFamilyNames = [
  'الشمري', 'العتيبي', 'القحطاني', 'الدوسري', 'المطيري', 
  'الحربي', 'السبيعي', 'الغامدي', 'الزهراني', 'العنزي'
];

// Generate a random Arabic name with components
export function generateArabicNameComponents(gender: 'male' | 'female'): {
  firstName: string;
  secondName: string;
  lastName: string;
  familyName: string;
  fullName: string;
} {
  const firstName = arabicFirstNames[gender][Math.floor(Math.random() * arabicFirstNames[gender].length)];
  const secondName = arabicSecondNames[gender][Math.floor(Math.random() * arabicSecondNames[gender].length)];
  const lastName = arabicThirdNames[gender][Math.floor(Math.random() * arabicThirdNames[gender].length)];
  const familyName = arabicFamilyNames[Math.floor(Math.random() * arabicFamilyNames.length)];

  return {
    firstName,
    secondName,
    lastName,
    familyName,
    fullName: `${firstName} ${secondName} ${lastName} ${familyName}`
  };
}

// Generate a random Arabic name (for backward compatibility)
export function generateArabicName(gender: 'male' | 'female'): string {
  const nameComponents = generateArabicNameComponents(gender);
  return nameComponents.fullName;
}

// Simple transliteration map (in a real app, would use a more comprehensive transliteration library)
const transliterationMap: Record<string, string> = {
  // First names
  'محمد': 'Mohammed', 'أحمد': 'Ahmed', 'عبدالله': 'Abdullah', 'سعود': 'Saud', 'فهد': 'Fahad',
  'خالد': 'Khalid', 'عبدالعزيز': 'Abdulaziz', 'سلمان': 'Salman', 'عمر': 'Omar', 'علي': 'Ali',
  'نورة': 'Noura', 'سارة': 'Sara', 'فاطمة': 'Fatima', 'عائشة': 'Aisha', 'منيرة': 'Munira',
  'هيا': 'Haya', 'الجوهرة': 'Aljohara', 'ريم': 'Reem', 'لطيفة': 'Latifa', 'مها': 'Maha',

  // Second and third names
  'عبدالرحمن': 'Abdulrahman', 'سلطان': 'Sultan', 'فيصل': 'Faisal', 'ناصر': 'Nasser',
  'سعد': 'Saad', 'بندر': 'Bandar', 'تركي': 'Turki', 'ماجد': 'Majid', 'عادل': 'Adel',

  // Family names
  'الشمري': 'AlShammari', 'العتيبي': 'AlOtaibi', 'القحطاني': 'AlQahtani', 'الدوسري': 'AlDossari',
  'المطيري': 'AlMutairi', 'الحربي': 'AlHarbi', 'السبيعي': 'AlSubaie', 'الغامدي': 'AlGhamdi',
  'الزهراني': 'AlZahrani', 'العنزي': 'AlAnazi'
};

// Transliterate an Arabic name components to English
export function transliterateArabicNameComponents(arabicNameComponents: {
  firstName: string;
  secondName: string;
  lastName: string;
  familyName: string;
}): {
  firstName: string;
  secondName: string;
  lastName: string;
  familyName: string;
  fullName: string;
} {
  const firstName = transliterationMap[arabicNameComponents.firstName] || arabicNameComponents.firstName;
  const secondName = transliterationMap[arabicNameComponents.secondName] || arabicNameComponents.secondName;
  const lastName = transliterationMap[arabicNameComponents.lastName] || arabicNameComponents.lastName;
  const familyName = transliterationMap[arabicNameComponents.familyName] || arabicNameComponents.familyName;

  return {
    firstName,
    secondName,
    lastName,
    familyName,
    fullName: `${firstName} ${secondName} ${lastName} ${familyName}`
  };
}

// Transliterate an Arabic name to English (for backward compatibility)
export function transliterateArabicName(arabicName: string): string {
  const parts = arabicName.split(' ');
  return parts.map(part => transliterationMap[part] || part).join(' ');
}

// Generate a random email based on a name
export function generateEmail(name: string): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'example.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];

  // Extract first name if full name is provided
  const firstName = name.split(' ')[0];

  // Remove spaces and special characters
  const cleanName = firstName.toLowerCase().replace(/\s+/g, '.').replace(/[^\w.]/g, '');

  // Add a random 2-digit number to make it more unique
  const randomNum = Math.floor(Math.random() * 100);

  return `${cleanName}${randomNum}@${domain}`;
}

// Sample addresses (in a real app, would use a more comprehensive dataset)
const saudiAddresses = [
  { arabic: 'الرياض، حي الملز، شارع الأمير ناصر', english: 'Riyadh, Al Malaz, Prince Nasser St' },
  { arabic: 'جدة، حي الروضة، شارع فلسطين', english: 'Jeddah, Al Rawdah, Palestine St' },
  { arabic: 'الدمام، حي الشاطئ، شارع الأمير محمد', english: 'Dammam, Al Shati, Prince Mohammed St' },
  { arabic: 'مكة المكرمة، حي العزيزية، شارع الملك فهد', english: 'Makkah, Al Aziziyah, King Fahad St' },
  { arabic: 'المدينة المنورة، حي قباء، شارع أبي ذر الغفاري', english: 'Madinah, Quba, Abu Dhar Al Ghafari St' }
];

// Generate a random address
export function generateAddress(): { arabic: string; english: string } {
  return saudiAddresses[Math.floor(Math.random() * saudiAddresses.length)];
}

// Generate a complete person record
export interface Person {
  // Full names (for backward compatibility)
  arabicName: string;
  englishName: string;

  // Arabic name components
  arabicFirstName: string;
  arabicSecondName: string;
  arabicLastName: string;
  arabicFamilyName: string;

  // English name components
  englishFirstName: string;
  englishSecondName: string;
  englishLastName: string;
  englishFamilyName: string;

  gender: 'male' | 'female';
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  address: {
    arabic: string;
    english: string;
  };
  nationality: 'Saudi' | 'Non-Saudi';
  idType: 'NID' | 'Iqama' | 'Passport';
  idNumber: string;
}

export function generatePerson(
  nationality: 'Saudi' | 'Non-Saudi' = 'Saudi',
  idType: 'NID' | 'Iqama' | 'Passport' = 'NID'
): Person {
  // Determine gender
  const gender = Math.random() > 0.5 ? 'male' : 'female';

  // Generate name components
  const arabicNameComponents = generateArabicNameComponents(gender);
  const englishNameComponents = transliterateArabicNameComponents(arabicNameComponents);

  // Generate ID number based on ID type
  let idNumber: string;

  if (nationality === 'Saudi') {
    // For Saudi, always use NID
    idType = 'NID';
    idNumber = generateSaudiNID();
  } else {
    // For non-Saudi, use the specified ID type
    idNumber = idType === 'Iqama' ? generateIqamaID() : generatePassportID();
  }

  return {
    // Full names (for backward compatibility)
    arabicName: arabicNameComponents.fullName,
    englishName: englishNameComponents.fullName,

    // Arabic name components
    arabicFirstName: arabicNameComponents.firstName,
    arabicSecondName: arabicNameComponents.secondName,
    arabicLastName: arabicNameComponents.lastName,
    arabicFamilyName: arabicNameComponents.familyName,

    // English name components
    englishFirstName: englishNameComponents.firstName,
    englishSecondName: englishNameComponents.secondName,
    englishLastName: englishNameComponents.lastName,
    englishFamilyName: englishNameComponents.familyName,

    gender,
    dateOfBirth: generateDateOfBirth(),
    phoneNumber: generateSaudiPhoneNumber(),
    email: generateEmail(englishNameComponents.fullName),
    address: generateAddress(),
    nationality,
    idType,
    idNumber
  };
}

// Generate multiple people
export function generatePeople(
  count: number,
  nationality: 'Saudi' | 'Non-Saudi' = 'Saudi',
  idType: 'NID' | 'Iqama' | 'Passport' = 'NID'
): Person[] {
  const people: Person[] = [];
  for (let i = 0; i < count; i++) {
    people.push(generatePerson(nationality, idType));
  }
  return people;
}
