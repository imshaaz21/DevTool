'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { Person, generatePeople } from '@/utils/saudiDataGenerator';
import { InteractiveJson } from '@/components/InteractiveJson';
import { Database, Download, Copy, RefreshCw, Table as TableIcon, FileJson, Users } from 'lucide-react';

export default function SaudiDataGeneratorPage() {
  const { width } = useSidebar();
  const [count, setCount] = useState<number>(5);
  const [countInput, setCountInput] = useState<string>('5');
  const [people, setPeople] = useState<Person[]>([]);
  const [outputFormat, setOutputFormat] = useState<'json' | 'table'>('table');
  const [loading, setLoading] = useState<boolean>(false);
  const [nationality, setNationality] = useState<'Saudi' | 'Non-Saudi'>('Saudi');
  const [idType, setIdType] = useState<'NID' | 'Iqama' | 'Passport'>('NID');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

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
      }, 100);
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
    // Simple toast would be better but keeping it simple for now
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
  };

  const totalPages = Math.ceil(people.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPageData = people.slice(startIndex, endIndex);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main 
        className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300"
        style={{ marginLeft: width }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Saudi Data Generator</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Valid ID checksums & realistic test profiles.</p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || count < 1}
            className="group relative px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              {loading ? 'Generating...' : 'Regenerate'}
            </div>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="stat-card group hover:border-indigo-500/50 transition-colors">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Records</label>
              <input
                type="text"
                value={countInput}
                onChange={(e) => handleCountChange(e.target.value)}
                onBlur={handleCountBlur}
                className="w-full mt-1 bg-transparent text-2xl font-black text-slate-900 dark:text-white outline-none"
              />
            </div>
            
            <SettingCard 
              label="Nationality" 
              value={nationality} 
              onChange={(val) => handleNationalityChange(val as any)}
              options={['Saudi', 'Non-Saudi']}
            />

            <SettingCard 
              label="ID Type" 
              value={idType} 
              disabled={nationality === 'Saudi'}
              onChange={(val) => setIdType(val as any)}
              options={nationality === 'Saudi' ? ['NID'] : ['Passport', 'Iqama']}
            />

            <SettingCard 
              label="View Mode" 
              value={outputFormat} 
              onChange={(val) => setOutputFormat(val as any)}
              options={['table', 'json']}
            />
          </div>

          {/* Results Table/JSON */}
          {people.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Users size={14} />
                    <span>{people.length} Profiles Generated</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ActionButton icon={<Copy size={14} />} onClick={handleCopyToClipboard} label="Copy JSON" />
                  <ActionButton icon={<Download size={14} />} onClick={() => handleExport('csv')} label="Export CSV" />
                </div>
              </div>

              <div className="p-0">
                {outputFormat === 'table' ? (
                  <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <Th>ID Type</Th>
                          <Th>ID Number</Th>
                          <Th>Name</Th>
                          <Th>Gender</Th>
                          <Th>DOB</Th>
                          <Th>Nationality</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {currentPageData.map((person, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <Td><span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">{person.idType}</span></Td>
                            <Td className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{person.idNumber}</Td>
                            <Td>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{person.englishName}</span>
                                <span className="text-xs text-slate-400 font-arabic leading-relaxed">{person.arabicName}</span>
                              </div>
                            </Td>
                            <Td className="capitalize text-xs font-medium text-slate-500">{person.gender}</Td>
                            <Td className="text-xs text-slate-500">{person.dateOfBirth}</Td>
                            <Td><span className="text-xs font-bold text-slate-600 dark:text-slate-300">{person.nationality}</span></Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6">
                    <InteractiveJson data={people} editable={true} onEdit={setPeople} />
                  </div>
                )}
              </div>

              {/* Pagination */}
              {outputFormat === 'table' && totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-20"
                  >
                    <RefreshCw size={14} className="-scale-x-100" />
                  </button>
                  <div className="text-xs font-black text-slate-400">PAGE {currentPage} OF {totalPages}</div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-20"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SettingCard({ label, value, onChange, options, disabled = false }: { label: string, value: string, onChange: (v: string) => void, options: string[], disabled?: boolean }) {
  return (
    <div className={`stat-card group hover:border-indigo-500/50 transition-all ${disabled ? 'opacity-30 grayscale' : ''}`}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full mt-1 bg-transparent text-xl font-black text-slate-900 dark:text-white outline-none cursor-pointer appearance-none"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function ActionButton({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all text-xs font-bold text-slate-600 dark:text-slate-300">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>;
}
