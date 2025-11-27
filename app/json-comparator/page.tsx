'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { compareJsonObjects } from '@/utils/jsonComparator';
import { JsonEditorComponent } from '@/components/JsonEditorComponent';
import { JsonDiffViewer } from '@/components/JsonDiffViewer';
import { ArrowLeft } from 'lucide-react';

export default function JsonComparatorPage() {
  // JSON data state
  const [jsonA, setJsonA] = useState<any>({
    configValue: {
      release: {
        enableNewUI: true,
        enableDarkMode: false,
        enableBetaFeatures: true,
        enableAnalytics: false
      }
    }
  });
  const [jsonB, setJsonB] = useState<any>({
    configValue: {
      release: {
        enableNewUI: true,
        enableDarkMode: true,
        enableBetaFeatures: false,
        enableAnalytics: false
      }
    }
  });

  // Comparison state
  const [comparison, setComparison] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Validation state
  const [validationError, setValidationError] = useState<string>('');
  const [isValidStructure, setIsValidStructure] = useState<boolean>(false);

  // View mode: 'input' for editing JSONs, 'comparison' for viewing results
  const [viewMode, setViewMode] = useState<'input' | 'comparison'>('input');

  // View selector for comparison sections
  const [selectedView, setSelectedView] = useState<'common' | 'values' | 'keys' | 'all'>('keys');

  // Auto-reset comparison when JSONs change
  useEffect(() => {
    if (viewMode === 'comparison') {
      // Reset to input mode when JSONs change after a comparison
      setViewMode('input');
      setComparison(null);
      setError('');
    }

    // Validate structure in real-time
    validateStructure();
  }, [jsonA, jsonB]);

  // Helper function to check if JSON has configValue.release structure
  const hasConfigValueRelease = (json: any): boolean => {
    return json &&
      typeof json === 'object' &&
      json.configValue &&
      typeof json.configValue === 'object' &&
      json.configValue.release &&
      typeof json.configValue.release === 'object';
  };

  // Validate structure for both JSONs
  const validateStructure = () => {
    try {
      if (!jsonA || typeof jsonA !== 'object') {
        setValidationError('JSON A is not a valid object');
        setIsValidStructure(false);
        return;
      }
      if (!jsonB || typeof jsonB !== 'object') {
        setValidationError('JSON B is not a valid object');
        setIsValidStructure(false);
        return;
      }

      const hasStructureA = hasConfigValueRelease(jsonA);
      const hasStructureB = hasConfigValueRelease(jsonB);

      if (!hasStructureA && !hasStructureB) {
        setValidationError('Both JSONs must have the configValue.release structure for feature toggle comparison');
        setIsValidStructure(false);
        return;
      }

      if (!hasStructureA) {
        setValidationError('JSON A is missing the required configValue.release structure');
        setIsValidStructure(false);
        return;
      }

      if (!hasStructureB) {
        setValidationError('JSON B is missing the required configValue.release structure');
        setIsValidStructure(false);
        return;
      }

      // Structure is valid
      setValidationError('');
      setIsValidStructure(true);
    } catch (err) {
      setValidationError('Error validating JSON structure');
      setIsValidStructure(false);
    }
  };

  const handleCompare = () => {
    setError('');
    setComparison(null);

    try {
      // Validate JSON objects
      if (!jsonA || typeof jsonA !== 'object') {
        throw new Error('JSON A is not a valid object');
      }
      if (!jsonB || typeof jsonB !== 'object') {
        throw new Error('JSON B is not a valid object');
      }

      // Check if this is a feature toggle JSON (has configValue.release structure)
      const isFeatureToggleA = hasConfigValueRelease(jsonA);
      const isFeatureToggleB = hasConfigValueRelease(jsonB);

      // If either JSON has the feature toggle structure, validate both
      if (isFeatureToggleA || isFeatureToggleB) {
        if (!isFeatureToggleA) {
          throw new Error('JSON A does not have the required configValue.release structure for feature toggle comparison');
        }
        if (!isFeatureToggleB) {
          throw new Error('JSON B does not have the required configValue.release structure for feature toggle comparison');
        }

        // Validate that all values in configValue.release are boolean
        validateFeatureToggleValues(jsonA, 'A');
        validateFeatureToggleValues(jsonB, 'B');
      }

      // Only compare keys within configValue.release
      const releaseA = jsonA.configValue.release;
      const releaseB = jsonB.configValue.release;
      const result = compareJsonObjects(releaseA, releaseB);
      setComparison(result);
      setViewMode('comparison');
    } catch (err) {
      setError(`Error comparing JSON: ${(err as Error).message}`);
    }
  };

  // Helper function to validate that all values in configValue.release are boolean
  const validateFeatureToggleValues = (json: any, label: string) => {
    const release = json.configValue.release;

    // Recursively check all values are boolean
    const checkValues = (obj: any, path: string = 'configValue.release'): void => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const currentPath = `${path}.${key}`;

          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively check nested objects
            checkValues(value, currentPath);
          } else if (typeof value !== 'boolean') {
            throw new Error(
              `Invalid feature toggle value in JSON ${label} at ${currentPath}: ` +
              `Expected boolean (true/false), but got ${typeof value} (${JSON.stringify(value)})`
            );
          }
        }
      }
    };

    checkValues(release);
  };

  const handleNewComparison = () => {
    setViewMode('input');
    setComparison(null);
    setError('');
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Feature Toggle Comparison</h1>
            <div className="flex items-center gap-4">
              {viewMode === 'comparison' && (
                <div className="flex items-center gap-2">
                  <label htmlFor="view-selector" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    View:
                  </label>
                  <select
                    id="view-selector"
                    value={selectedView}
                    onChange={(e) => setSelectedView(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="common">Common Keys Only</option>
                    <option value="values">Value Differences Only</option>
                    <option value="keys">Key Differences Only</option>
                    <option value="all">All Sections</option>
                  </select>
                </div>
              )}
              {viewMode === 'input' ? (
                <>
                  <button
                    onClick={handleCompare}
                    disabled={!isValidStructure}
                    className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Compare JSONs
                  </button>
                  {validationError && (
                    <div className="ml-4 text-sm text-amber-600 dark:text-amber-400">
                      ⚠️ {validationError}
                    </div>
                  )}
                </>
              ) : (
                <button onClick={handleNewComparison} className="btn btn-secondary flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  New Comparison
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Input View */}
        {viewMode === 'input' && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* JSON A Editor - Left Side */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">JSON A</h2>
                <JsonEditorComponent
                  json={jsonA}
                  onChange={setJsonA}
                  mode="code"
                  height="600px"
                />
              </div>

              {/* JSON B Editor - Right Side */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">JSON B</h2>
                <JsonEditorComponent
                  json={jsonB}
                  onChange={setJsonB}
                  mode="code"
                  height="600px"
                />
              </div>
            </div>
          </div>
        )}

        {/* Comparison View */}
        {viewMode === 'comparison' && comparison && (
          <div className="p-6 space-y-6">
            {/* 1. Common Keys Section (No Differences) */}
            {(selectedView === 'common' || selectedView === 'all') && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">
                  Common Keys - No Differences
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                    ({comparison.commonKeysWithSameValue.length} keys)
                  </span>
                </h2>
                {comparison.commonKeysWithSameValue.length > 0 ? (
                  <div className={`bg-green-50 dark:bg-green-900/10 p-4 rounded-md overflow-y-auto ${selectedView === 'all' ? 'max-h-96' : 'max-h-[75vh]'}`}>
                    <ul className="space-y-1">
                      {comparison.commonKeysWithSameValue.map((key: string, index: number) => (
                        <li key={index} className="font-mono text-sm text-green-700 dark:text-green-400 break-words">
                          ✓ {key}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">No common keys with identical values</p>
                )}
              </div>
            )}

            {/* 2. Value Differences */}
            {(selectedView === 'values' || selectedView === 'all') && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">
                  Value Differences
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                    ({comparison.valueDiffs?.length || 0} keys)
                  </span>
                </h2>
                {comparison.valueDiffs && comparison.valueDiffs.length > 0 ? (
                  <div className={`space-y-4 overflow-y-auto ${selectedView === 'all' ? 'max-h-[600px]' : 'max-h-[75vh]'}`}>
                    {comparison.valueDiffs.map((diff: any, index: number) => (
                      <div key={index} className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
                        {/* Key Path */}
                        <div className="font-mono font-semibold text-yellow-800 dark:text-yellow-300 mb-3 break-words">
                          {diff.key}
                        </div>

                        {/* Side-by-side value comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Value in A */}
                          <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded border border-red-200 dark:border-red-800">
                            <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">Value in A:</div>
                            <div className="max-h-64 overflow-auto">
                              <pre className="font-mono text-sm break-words whitespace-pre-wrap">
                                {typeof diff.valueA === 'object'
                                  ? JSON.stringify(diff.valueA, null, 2)
                                  : String(diff.valueA)}
                              </pre>
                            </div>
                          </div>

                          {/* Value in B */}
                          <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded border border-green-200 dark:border-green-800">
                            <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">Value in B:</div>
                            <div className="max-h-64 overflow-auto">
                              <pre className="font-mono text-sm break-words whitespace-pre-wrap">
                                {typeof diff.valueB === 'object'
                                  ? JSON.stringify(diff.valueB, null, 2)
                                  : String(diff.valueB)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">No value differences found</p>
                )}
              </div>
            )}

            {/* 3. Key Differences (Side-by-Side) */}
            {(selectedView === 'keys' || selectedView === 'all') && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Key Differences</h2>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${selectedView === 'all' ? 'max-h-[600px] overflow-y-auto' : 'max-h-[75vh] overflow-y-auto'}`}>
                  {/* Keys only in A */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">
                      Only in A ({comparison.keysOnlyInA.length} keys)
                    </h3>
                    <div className={`bg-red-50 dark:bg-red-900/10 p-4 rounded-md border border-red-200 dark:border-red-800 ${selectedView === 'keys' ? 'max-h-[55vh] overflow-y-auto' : ''}`}>
                      {comparison.keysOnlyInA.length > 0 ? (
                        <ul className="space-y-1">
                          {comparison.keysOnlyInA.map((key: string, index: number) => (
                            <li key={index} className="font-mono text-sm text-red-700 dark:text-red-400 break-words">
                              - {key}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No unique keys in A</p>
                      )}
                    </div>
                  </div>

                  {/* Keys only in B */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">
                      Only in B ({comparison.keysOnlyInB.length} keys)
                    </h3>
                    <div className={`bg-green-50 dark:bg-green-900/10 p-4 rounded-md border border-green-200 dark:border-green-800 ${selectedView === 'keys' ? 'max-h-[55vh] overflow-y-auto' : ''}`}>
                      {comparison.keysOnlyInB.length > 0 ? (
                        <ul className="space-y-1">
                          {comparison.keysOnlyInB.map((key: string, index: number) => (
                            <li key={index} className="font-mono text-sm text-green-700 dark:text-green-400 break-words">
                              + {key}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No unique keys in B</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold mb-3">Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="stat-card">
                      <div className="stat-label">Total Keys in A</div>
                      <div className="stat-value">{comparison.totalKeysA}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Total Keys in B</div>
                      <div className="stat-value">{comparison.totalKeysB}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Common Keys</div>
                      <div className="stat-value">{comparison.keysInBoth.length}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Differences</div>
                      <div className="stat-value">
                        {comparison.valueDiffs.length + comparison.keysOnlyInA.length + comparison.keysOnlyInB.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
