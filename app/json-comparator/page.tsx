'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { compareJsonObjects, prettyPrintJson, createTreeFromKeys, mergeTrees, TreeNode } from '@/utils/jsonComparator';
import { InteractiveJson } from '@/components/InteractiveJson';

export default function JsonComparatorPage() {
  const [jsonA, setJsonA] = useState<string>('');
  const [jsonB, setJsonB] = useState<string>('');
  const [parsedA, setParsedA] = useState<any>(null);
  const [parsedB, setParsedB] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'diff' | 'tree' | 'pretty'>('diff');

  const handleCompare = () => {
    setError('');
    setComparison(null);

    try {
      const objA = JSON.parse(jsonA || '{}');
      const objB = JSON.parse(jsonB || '{}');

      setParsedA(objA);
      setParsedB(objB);

      const result = compareJsonObjects(objA, objB);
      setComparison(result);
    } catch (err) {
      setError(`Error parsing JSON: ${(err as Error).message}`);
    }
  };

  const handleClearAll = () => {
    setJsonA('');
    setJsonB('');
    setParsedA(null);
    setParsedB(null);
    setComparison(null);
    setError('');
  };

  const renderTreeView = () => {
    if (!comparison) return null;

    // Create trees for keys only in A and only in B
    const treeA = createTreeFromKeys(comparison.keysOnlyInA, parsedA, 'removed');
    const treeB = createTreeFromKeys(comparison.keysOnlyInB, parsedB, 'added');

    // Merge the trees
    const mergedTree = mergeTrees(treeA, treeB);

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Tree Diff View</h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-96">
          {renderTreeNode(mergedTree)}
        </div>
      </div>
    );
  };

  const renderTreeNode = (node: TreeNode) => {
    if (!node.children || node.children.length === 0) {
      return null;
    }

    return (
      <ul className="pl-4 border-l border-gray-300 dark:border-gray-700">
        {node.children.map((child, index) => (
          <li key={index} className="my-1">
            <div className={`flex items-start ${
              child.status === 'added' 
                ? 'text-green-600 dark:text-green-400' 
                : child.status === 'removed' 
                  ? 'text-red-600 dark:text-red-400' 
                  : ''
            }`}>
              <span className="font-mono">
                {child.status === 'added' && '+ '}
                {child.status === 'removed' && '- '}
                {child.name}
                {child.value !== undefined && ': '}
                {child.value !== undefined && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {typeof child.value === 'object' 
                      ? JSON.stringify(child.value) 
                      : String(child.value)}
                  </span>
                )}
              </span>
            </div>
            {child.children && child.children.length > 0 && renderTreeNode(child)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">JSON Key Comparator</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">JSON A</h2>
            <textarea
              className="w-full h-64 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
              value={jsonA}
              onChange={(e) => setJsonA(e.target.value)}
              placeholder="Paste your first JSON here..."
            />
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">JSON B</h2>
            <textarea
              className="w-full h-64 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
              value={jsonB}
              onChange={(e) => setJsonB(e.target.value)}
              placeholder="Paste your second JSON here..."
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={handleCompare} className="btn btn-primary">
            Compare
          </button>
          <button onClick={handleClearAll} className="btn btn-secondary">
            Clear All
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {comparison && (
          <div className="card">
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
              <button
                className={`px-4 py-2 ${activeTab === 'diff' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
                onClick={() => setActiveTab('diff')}
              >
                Key Differences
              </button>
              <button
                className={`px-4 py-2 ${activeTab === 'tree' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
                onClick={() => setActiveTab('tree')}
              >
                Tree View
              </button>
              <button
                className={`px-4 py-2 ${activeTab === 'pretty' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
                onClick={() => setActiveTab('pretty')}
              >
                Pretty JSON
              </button>
            </div>

            {activeTab === 'diff' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Keys in A but not in B ({comparison.keysOnlyInA.length})</h3>
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md overflow-auto max-h-96">
                      {comparison.keysOnlyInA.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {comparison.keysOnlyInA.map((key: string, index: number) => (
                            <li key={index} className="font-mono text-sm">{key}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No unique keys in A</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Keys in B but not in A ({comparison.keysOnlyInB.length})</h3>
                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-md overflow-auto max-h-96">
                      {comparison.keysOnlyInB.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {comparison.keysOnlyInB.map((key: string, index: number) => (
                            <li key={index} className="font-mono text-sm">{key}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No unique keys in B</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Keys in both but with different values ({comparison.valueDiffs?.length || 0})</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-md overflow-auto max-h-96">
                    {comparison.valueDiffs && comparison.valueDiffs.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {comparison.valueDiffs.map((diff: any, index: number) => (
                          <li key={index} className="font-mono text-sm mb-2">
                            <div className="font-semibold">{diff.key}</div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Value in A:</div>
                                <div>{typeof diff.valueA === 'object' 
                                  ? JSON.stringify(diff.valueA) 
                                  : String(diff.valueA)}</div>
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Value in B:</div>
                                <div>{typeof diff.valueB === 'object' 
                                  ? JSON.stringify(diff.valueB) 
                                  : String(diff.valueB)}</div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No value differences found</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Summary</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                    <p>Total keys in A: {comparison.totalKeysA}</p>
                    <p>Total keys in B: {comparison.totalKeysB}</p>
                    <p>Keys in both: {comparison.keysInBoth.length}</p>
                    <p>Keys with different values: {comparison.valueDiffs?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tree' && renderTreeView()}

            {activeTab === 'pretty' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">JSON A (Pretty)</h3>
                  {parsedA ? (
                    <InteractiveJson 
                      data={parsedA} 
                      editable={true} 
                      onEdit={(newData) => {
                        setParsedA(newData);
                        setJsonA(JSON.stringify(newData, null, 2));
                      }} 
                    />
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">No data</div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">JSON B (Pretty)</h3>
                  {parsedB ? (
                    <InteractiveJson 
                      data={parsedB} 
                      editable={true} 
                      onEdit={(newData) => {
                        setParsedB(newData);
                        setJsonB(JSON.stringify(newData, null, 2));
                      }} 
                    />
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">No data</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
