'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { Person, generatePeople } from '@/utils/saudiDataGenerator';
import { InteractiveJson } from '@/components/InteractiveJson';
import { CustomSelect } from '@/components/CustomSelect';
import { AutoToggle } from '@/components/AutoToggle';
import {
  Database,
  Download,
  Copy,
  RefreshCw,
  Table as TableIcon,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';

export default function SaudiDataGeneratorPage() {
  const { width } = useSidebar();
  const [count, setCount] = useState<number>(5);
  const [countInput, setCountInput] = useState<string>('5');
  const [people, setPeople] = useState<Person[]>([]);
  const [outputFormat, setOutputFormat] = useState<'table' | 'json'>('table');
  const [loading, setLoading] = useState<boolean>(false);
  const [nationality, setNationality] = useState<'Saudi' | 'Non-Saudi'>('Saudi');
  const [idType, setIdType] = useState<'NID' | 'Iqama' | 'Passport'>('NID');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const rowsPerPage = 10;

  useEffect(() => {
    if (autoGenerate) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, nationality, idType, autoGenerate]);

  const handleNationalityChange = (newNationality: 'Saudi' | 'Non-Saudi') => {
    setNationality(newNationality);
    if (newNationality === 'Saudi') {
      setIdType('NID');
    } else {
      setIdType('Passport');
    }
  };

  const handleCountChange = (value: string) => {
    const filtered = value.replace(/[^0-9]/g, '');
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
    if (count > 1000) {
      const confirmed = confirm(`You're about to generate ${count.toLocaleString()} records. Continue?`);
      if (!confirmed) return;
    }

    setLoading(true);
    setCurrentPage(1);
    setPeople([]);

    const chunkSize = 10000;
    const chunks = Math.ceil(count / chunkSize);

    if (count <= chunkSize) {
      setTimeout(() => {
        const generatedPeople = generatePeople(count, nationality, idType);
        setPeople(generatedPeople);
        setLoading(false);
      }, 50);
    } else {
      const allPeople: Person[] = [];
      for (let i = 0; i < chunks; i++) {
        const currentChunkSize = i === chunks - 1 ? count - (i * chunkSize) : chunkSize;
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
    toast.success('Copied all profiles as JSON');
  };

  const handleCopySingle = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
    toast.success('Copied to clipboard');
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
      const headers = ['ID Number', 'Arabic Name', 'English Name', 'Gender', 'Date of Birth', 'Phone Number', 'Email', 'Nationality', 'ID Type'].join(',');
      const rows = people.map(p => [p.idNumber, `"${p.arabicName}"`, `"${p.englishName}"`, p.gender, p.dateOfBirth, p.phoneNumber, p.email, p.nationality, p.idType].join(','));
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
    URL.revokeObjectURL(url);
    toast.success(`Exported ${fileName}`);
  };

  const totalPages = Math.ceil(people.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPageData = people.slice(startIndex, endIndex);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={Database}
          title="Saudi Fake Data Generator"
          description="Generate mock individual profiles with valid Saudi checksums and formats."
          badge="RFC Checksum"
        >
          <AutoToggle
            enabled={autoGenerate}
            onChange={setAutoGenerate}
          />
          <button
            onClick={() => handleGenerate()}
            disabled={loading || count < 1}
            className="btn btn-primary"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Generating...' : 'Regenerate'}</span>
          </button>
        </PageHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Controls Card */}
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Record Count */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Record Count
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={countInput}
                    onChange={(e) => handleCountChange(e.target.value)}
                    onBlur={handleCountBlur}
                    placeholder="e.g. 5"
                    className="input font-mono text-sm py-1.5"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[5, 20, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setCount(preset);
                          setCountInput(preset.toString());
                        }}
                        className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                          count === preset
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                            : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Nationality
                </label>
                <CustomSelect
                  value={nationality}
                  onChange={(val) => handleNationalityChange(val as any)}
                  options={['Saudi', 'Non-Saudi']}
                />
              </div>

              {/* ID Type */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  ID Type
                </label>
                <CustomSelect
                  value={idType}
                  disabled={nationality === 'Saudi'}
                  onChange={(val) => setIdType(val as any)}
                  options={nationality === 'Saudi' ? ['NID'] : ['Passport', 'Iqama']}
                />
              </div>

              {/* View Format */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  View Format
                </label>
                <div className="grid grid-cols-2 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setOutputFormat('table')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors ${
                      outputFormat === 'table'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <TableIcon size={13} />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputFormat('json')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors ${
                      outputFormat === 'json'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <FileCode size={13} />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Container */}
          {people.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-mono">
                  {people.length.toLocaleString()} profiles generated
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="btn btn-secondary btn-sm"
                  >
                    <Copy size={12} />
                    <span>Copy JSON</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download size={12} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {outputFormat === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>ID Type</th>
                        <th>ID Number</th>
                        <th>Name (EN / AR)</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th>DOB</th>
                        <th>Nationality</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                      {currentPageData.map((person, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/50 transition-colors"
                        >
                          <td>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              {person.idType}
                            </span>
                          </td>
                          <td className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {person.idNumber}
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                {person.englishName}
                              </span>
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-arabic">
                                {person.arabicName}
                              </span>
                            </div>
                          </td>
                          <td className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                            {person.phoneNumber}
                          </td>
                          <td className="capitalize text-xs text-zinc-500 dark:text-zinc-400">
                            {person.gender}
                          </td>
                          <td className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                            {person.dateOfBirth}
                          </td>
                          <td className="text-xs text-zinc-600 dark:text-zinc-300">
                            {person.nationality}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => handleCopySingle(JSON.stringify(person, null, 2), idx)}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Copy profile JSON"
                            >
                              {copiedIndex === idx ? (
                                <Check size={13} className="text-emerald-500" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <InteractiveJson data={people} editable={true} onEdit={setPeople} />
                </div>
              )}

              {/* Pagination */}
              {outputFormat === 'table' && totalPages > 1 && (
                <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono">
                  <span>Page {currentPage} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
