'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Person, generatePeople } from '@/utils/saudiDataGenerator';
import { InteractiveJson } from '@/components/InteractiveJson';

export default function SaudiDataGeneratorPage() {
  const [count, setCount] = useState<number>(5); // Default to 5
  const [countInput, setCountInput] = useState<string>('5'); // For input field
  const [people, setPeople] = useState<Person[]>([]);
  const [outputFormat, setOutputFormat] = useState<'json' | 'table'>('table'); // Default to table
  const [loading, setLoading] = useState<boolean>(false);
  const [nationality, setNationality] = useState<'Saudi' | 'Non-Saudi'>('Saudi');
  const [idType, setIdType] = useState<'NID' | 'Iqama' | 'Passport'>('NID');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 5; // Show 10 rows per page in table view

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleNationalityChange = (newNationality: 'Saudi' | 'Non-Saudi') => {
    setNationality(newNationality);
    if (newNationality === 'Saudi') {
      setIdType('NID');
    } else {
      setIdType('Passport');
    }
  };

  const handleCountChange = (value: string) => {
    // Only allow digits 0-9, no minus or other characters
    const filtered = value.replace(/[^0-9]/g, '');

    // Prevent leading zeros (e.g., "05" becomes "5")
    const withoutLeadingZeros = filtered.replace(/^0+/, '');

    setCountInput(withoutLeadingZeros);
    const parsed = parseInt(withoutLeadingZeros);
    if (!isNaN(parsed) && parsed > 0) {
      setCount(parsed);
    }
  };

  const handleCountBlur = () => {
    const parsed = parseInt(countInput);
    if (isNaN(parsed) || parsed < 1) {
      setCount(1);
      setCountInput('1');
    } else {
      setCount(parsed);
      setCountInput(parsed.toString());
    }
  };

  const handleGenerate = async () => {
    // Warn for very large datasets
    if (count > 1000) {
      const confirmed = confirm(
        `You're about to generate ${count.toLocaleString()} records. This might take a moment. Continue?`
      );
      if (!confirmed) return;
    }

    setLoading(true);
    setCurrentPage(1); // Reset to first page
    setPeople([]); // Clear existing data

    // For large datasets, generate in chunks to prevent UI freezing
    const chunkSize = 10000;
    const chunks = Math.ceil(count / chunkSize);

    if (count <= chunkSize) {
      // Small dataset - generate all at once
      setTimeout(() => {
        const generatedPeople = generatePeople(count, nationality, idType);
        setPeople(generatedPeople);
        setLoading(false);
      }, 100);
    } else {
      // Large dataset - generate in chunks
      const allPeople: Person[] = [];

      for (let i = 0; i < chunks; i++) {
        const currentChunkSize = i === chunks - 1
          ? count - (i * chunkSize)
          : chunkSize;

        // Use setTimeout to yield to the browser between chunks
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            const chunkPeople = generatePeople(currentChunkSize, nationality, idType);
            allPeople.push(...chunkPeople);
            resolve();
          }, 10);
        });
      }

      setPeople(allPeople);
      setLoading(false);
    }
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
      const headers = [
        'ID Number',
        'Arabic Name',
        'English Name',
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
        `"${person.englishName}"`,
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

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination logic for table view
  const totalPages = Math.ceil(people.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPageData = people.slice(startIndex, endIndex);

  return (
    <div className="flex min-h-screen max-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto overflow-x-hidden max-h-screen">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Saudi Data Generator
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Generate realistic test data for Saudi and non-Saudi individuals with valid ID checksums
          </p>
        </div>

        {/* Generator Settings */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Generator Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="count" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Number of Records
              </label>
              <input
                id="count"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={countInput}
                onChange={(e) => handleCountChange(e.target.value)}
                onBlur={handleCountBlur}
                className="input"
              />
              {count > 10 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {count > 10 ? 'Table view will be paginated (10 rows per page)' : ''}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nationality
              </label>
              <select
                id="nationality"
                value={nationality}
                onChange={(e) => handleNationalityChange(e.target.value as 'Saudi' | 'Non-Saudi')}
                className="input"
              >
                <option value="Saudi">Saudi</option>
                <option value="Non-Saudi">Non-Saudi</option>
              </select>
            </div>

            <div>
              <label htmlFor="idType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ID Type
              </label>
              <select
                id="idType"
                value={idType}
                onChange={(e) => setIdType(e.target.value as 'NID' | 'Iqama' | 'Passport')}
                className="input"
                disabled={nationality === 'Saudi'}
              >
                {nationality === 'Saudi' ? (
                  <option value="NID">National ID</option>
                ) : (
                  <>
                    <option value="Passport">Passport</option>
                    <option value="Iqama">Iqama</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Output Format
              </label>
              <select
                id="format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as 'json' | 'table')}
                className="input"
              >
                <option value="table">Table</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerate}
              disabled={loading || count < 1}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Data'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {people.length > 0 && (
          <div className="card">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat-card">
                <div className="stat-label">Total Records</div>
                <div className="stat-value">{people.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Nationality</div>
                <div className="stat-value">{nationality}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">ID Type</div>
                <div className="stat-value">{idType}</div>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
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

            {/* Data Display */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Generated Data
                </h3>
                {outputFormat === 'table' && totalPages > 1 && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, people.length)} of {people.length}
                  </div>
                )}
              </div>

              {outputFormat === 'table' ? (
                <>
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="modern-table">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th>ID Type</th>
                          <th>ID Number</th>
                          <th>Arabic Name</th>
                          <th>English Name</th>
                          <th>Gender</th>
                          <th>Date of Birth</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Nationality</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPageData.map((person, index) => (
                          <tr key={index}>
                            <td className="font-medium">{person.idType}</td>
                            <td className="font-mono">{person.idNumber}</td>
                            <td>{person.arabicName}</td>
                            <td>{person.englishName}</td>
                            <td className="capitalize">{person.gender}</td>
                            <td>{person.dateOfBirth}</td>
                            <td>{person.phoneNumber}</td>
                            <td className="text-xs">{person.email}</td>
                            <td>{person.nationality}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <InteractiveJson data={people} editable={true} onEdit={setPeople} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
