'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Person, generatePeople } from '@/utils/saudiDataGenerator';
import { InteractiveJson } from '@/components/InteractiveJson';

export default function SaudiDataGeneratorPage() {
  const [count, setCount] = useState<number>(1);
  const [people, setPeople] = useState<Person[]>([]);
  const [outputFormat, setOutputFormat] = useState<'json' | 'table'>('table');
  const [loading, setLoading] = useState<boolean>(false);
  const [nationality, setNationality] = useState<'Saudi' | 'Non-Saudi'>('Saudi');
  const [idType, setIdType] = useState<'NID' | 'Iqama' | 'Passport'>('NID');

  // Generate default value record when the page loads
  useEffect(() => {
    handleGenerate();
  }, []);

  // Update ID type when nationality changes
  const handleNationalityChange = (newNationality: 'Saudi' | 'Non-Saudi') => {
    setNationality(newNationality);
    // Set default ID type based on nationality
    if (newNationality === 'Saudi') {
      setIdType('NID');
    } else {
      setIdType('Passport');
    }
  };

  const handleGenerate = () => {
    setLoading(true);
    // Simulate a delay for better UX
    setTimeout(() => {
      const generatedPeople = generatePeople(count, nationality, idType);
      setPeople(generatedPeople);
      setLoading(false);
    }, 300);
  };

  const handleCopyToClipboard = () => {
    const jsonData = JSON.stringify(people, null, 2);
    navigator.clipboard.writeText(jsonData);
    alert('Data copied to clipboard!');
  };

  const handleExport = (format: 'json' | 'csv') => {
    let data: string;
    let fileName: string;
    let mimeType: string;

    if (format === 'json') {
      data = JSON.stringify(people, null, 2);
      fileName = 'saudi-fake-data.json';
      mimeType = 'application/json';
    } else {
      // CSV format
      const headers = [
        'ID Number',
        'Arabic Name',
        'Arabic First Name',
        'Arabic Second Name',
        'Arabic Last Name',
        'Arabic Family Name',
        'English Name',
        'English First Name',
        'English Second Name',
        'English Last Name',
        'English Family Name',
        'Gender',
        'Date of Birth',
        'Phone Number',
        'Email',
        'Arabic Address',
        'English Address',
        'Nationality',
        'ID Type'
      ].join(',');

      const rows = people.map(person => [
        person.idNumber,
        `"${person.arabicName}"`,
        `"${person.arabicFirstName}"`,
        `"${person.arabicSecondName}"`,
        `"${person.arabicLastName}"`,
        `"${person.arabicFamilyName}"`,
        `"${person.englishName}"`,
        `"${person.englishFirstName}"`,
        `"${person.englishSecondName}"`,
        `"${person.englishLastName}"`,
        `"${person.englishFamilyName}"`,
        person.gender,
        person.dateOfBirth,
        person.phoneNumber,
        person.email,
        `"${person.address.arabic}"`,
        `"${person.address.english}"`,
        person.nationality,
        person.idType
      ].join(','));

      data = [headers, ...rows].join('\n');
      fileName = 'saudi-fake-data.csv';
      mimeType = 'text/csv';
    }

    // Create a blob and download link
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold mb-6">Saudi Fake Data Generator</h1>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Generator Settings</h2>

          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label htmlFor="count" className="block text-sm font-medium mb-1">
                Number of Records
              </label>
              <input
                id="count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="input w-32"
              />
            </div>

            <div>
              <label htmlFor="nationality" className="block text-sm font-medium mb-1">
                Nationality
              </label>
              <select
                id="nationality"
                value={nationality}
                onChange={(e) => handleNationalityChange(e.target.value as 'Saudi' | 'Non-Saudi')}
                className="input w-32"
              >
                <option value="Saudi">Saudi</option>
                <option value="Non-Saudi">Non-Saudi</option>
              </select>
            </div>

            <div>
              <label htmlFor="idType" className="block text-sm font-medium mb-1">
                ID Type
              </label>
              <select
                id="idType"
                value={idType}
                onChange={(e) => setIdType(e.target.value as 'NID' | 'Iqama' | 'Passport')}
                className="input w-32"
                disabled={nationality === 'Saudi'} // Disable if Saudi is selected
              >
                {nationality === 'Saudi' ? (
                  <option value="NID">NID</option>
                ) : (
                  <>
                    <option value="Passport">Passport</option>
                    <option value="Iqama">Iqama</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium mb-1">
                Output Format
              </label>
              <select
                id="format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as 'json' | 'table')}
                className="input w-32"
              >
                <option value="json">JSON</option>
                <option value="table">Table</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-primary mr-2"
          >
            {loading ? 'Generating...' : 'Generate Data'}
          </button>
        </div>

        {people.length > 0 && (
          <div className="card overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Data</h2>
              <div className="space-x-2">
                <button onClick={handleCopyToClipboard} className="btn btn-secondary">
                  Copy to Clipboard
                </button>
                <button onClick={() => handleExport('json')} className="btn btn-secondary">
                  Export JSON
                </button>
                <button onClick={() => handleExport('csv')} className="btn btn-secondary">
                  Export CSV
                </button>
              </div>
            </div>

            {outputFormat === 'table' ? (
              <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                <table className="w-auto divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">ID Type</th>
                      <th className="px-4 py-2 text-left">ID Number</th>
                      <th className="px-4 py-2 text-left">Arabic Name</th>
                      <th className="px-4 py-2 text-left">Arabic First Name</th>
                      <th className="px-4 py-2 text-left">Arabic Second Name</th>
                      <th className="px-4 py-2 text-left">Arabic Last Name</th>
                      <th className="px-4 py-2 text-left">Arabic Family Name</th>
                      <th className="px-4 py-2 text-left">English Name</th>
                      <th className="px-4 py-2 text-left">English First Name</th>
                      <th className="px-4 py-2 text-left">English Second Name</th>
                      <th className="px-4 py-2 text-left">English Last Name</th>
                      <th className="px-4 py-2 text-left">English Family Name</th>
                      <th className="px-4 py-2 text-left">Gender</th>
                      <th className="px-4 py-2 text-left">Date of Birth</th>
                      <th className="px-4 py-2 text-left">Phone</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Nationality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {people.map((person, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                        <td className="px-4 py-2">{person.idType}</td>
                        <td className="px-4 py-2">{person.idNumber}</td>
                        <td className="px-4 py-2">{person.arabicName}</td>
                        <td className="px-4 py-2">{person.arabicFirstName}</td>
                        <td className="px-4 py-2">{person.arabicSecondName}</td>
                        <td className="px-4 py-2">{person.arabicLastName}</td>
                        <td className="px-4 py-2">{person.arabicFamilyName}</td>
                        <td className="px-4 py-2">{person.englishName}</td>
                        <td className="px-4 py-2">{person.englishFirstName}</td>
                        <td className="px-4 py-2">{person.englishSecondName}</td>
                        <td className="px-4 py-2">{person.englishLastName}</td>
                        <td className="px-4 py-2">{person.englishFamilyName}</td>
                        <td className="px-4 py-2">{person.gender}</td>
                        <td className="px-4 py-2">{person.dateOfBirth}</td>
                        <td className="px-4 py-2">{person.phoneNumber}</td>
                        <td className="px-4 py-2">{person.email}</td>
                        <td className="px-4 py-2">{person.nationality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <InteractiveJson data={people} editable={true} onEdit={setPeople} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
