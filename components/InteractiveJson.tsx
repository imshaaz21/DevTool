'use client';

import { useState, useEffect } from 'react';

interface JsonViewerProps {
  data: any;
  editable?: boolean;
  onEdit?: (newData: any) => void;
}

interface ExpandedState {
  [key: string]: boolean;
}

export function InteractiveJson({ data, editable = false, onEdit }: JsonViewerProps) {
  const [expandedState, setExpandedState] = useState<ExpandedState>({});
  const [editableValue, setEditableValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editPath, setEditPath] = useState<string[]>([]);

  useEffect(() => {
    if (data) {
      try {
        setEditableValue(JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('Error stringifying JSON:', e);
      }
    }
  }, [data]);

  const toggleExpand = (path: string) => {
    setExpandedState(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleEdit = (path: string[]) => {
    setIsEditing(true);
    setEditPath(path);
  };

  const saveEdit = () => {
    try {
      const newData = JSON.parse(editableValue);
      if (onEdit) {
        onEdit(newData);
      }
      setIsEditing(false);
    } catch (e) {
      alert(`Invalid JSON: ${(e as Error).message}`);
    }
  };

  const cancelEdit = () => {
    setEditableValue(JSON.stringify(data, null, 2));
    setIsEditing(false);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(editableValue);
      setEditableValue(JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert(`Cannot format invalid JSON: ${(e as Error).message}`);
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(editableValue);
      setEditableValue(JSON.stringify(parsed));
    } catch (e) {
      alert(`Cannot minify invalid JSON: ${(e as Error).message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editableValue);
  };

  const updateJsonValue = (path: string[], newValue: any) => {
    try {
      const parsedData = JSON.parse(editableValue);
      let current = parsedData;

      for (let i = 0; i < path.length - 1; i++) {
        const part = path[i];
        if (part.match(/^\d+$/)) {
          current = current[parseInt(part, 10)];
        } else {
          current = current[part];
        }
      }

      const lastPart = path[path.length - 1];
      if (lastPart.match(/^\d+$/)) {
        current[parseInt(lastPart, 10)] = newValue;
      } else {
        current[lastPart] = newValue;
      }

      setEditableValue(JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('Error updating JSON value:', e);
    }
  };

  const renderValue = (value: any, path: string[] = [], level: number = 0, canEdit: boolean = false): JSX.Element => {
    const currentPath = path.join('.');

    if (value === null) {
      return canEdit ? (
        <span
          className="text-zinc-400 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 px-1 rounded"
          onClick={() => {
            const newValue = prompt('Edit value:', 'null');
            if (newValue !== null) {
              try {
                updateJsonValue(path, JSON.parse(newValue));
              } catch (e) {
                alert(`Invalid JSON: ${(e as Error).message}`);
              }
            }
          }}
        >
          null
        </span>
      ) : (
        <span className="text-zinc-400">null</span>
      );
    }

    if (typeof value === 'undefined') {
      return <span className="text-zinc-400">undefined</span>;
    }

    if (typeof value === 'boolean') {
      return canEdit ? (
        <span
          className="text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 px-1 rounded"
          onClick={() => {
            updateJsonValue(path, !value);
          }}
        >
          {value.toString()}
        </span>
      ) : (
        <span className="text-amber-600 dark:text-amber-400">{value.toString()}</span>
      );
    }

    if (typeof value === 'number') {
      return canEdit ? (
        <span
          className="text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 px-1 rounded"
          onClick={() => {
            const newValue = prompt('Edit value:', value.toString());
            if (newValue !== null) {
              const parsed = parseFloat(newValue);
              if (!isNaN(parsed)) {
                updateJsonValue(path, parsed);
              } else {
                alert('Please enter a valid number');
              }
            }
          }}
        >
          {value}
        </span>
      ) : (
        <span className="text-blue-600 dark:text-blue-400">{value}</span>
      );
    }

    if (typeof value === 'string') {
      return canEdit ? (
        <span
          className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 px-1 rounded"
          onClick={() => {
            const newValue = prompt('Edit value:', value);
            if (newValue !== null) {
              updateJsonValue(path, newValue);
            }
          }}
        >
          "{value}"
        </span>
      ) : (
        <span className="text-emerald-600 dark:text-emerald-400">"{value}"</span>
      );
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedState[currentPath] !== false;

      return (
        <div>
          <span
            className="cursor-pointer select-none text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            onClick={() => toggleExpand(currentPath)}
          >
            {isExpanded ? '▼' : '▶'} Array[{value.length}]
          </span>

          {isExpanded && (
            <div className="pl-4 border-l border-zinc-200 dark:border-zinc-800 ml-2">
              {value.map((item, index) => (
                <div key={index} className="my-1">
                  <span className="text-zinc-400">{index}: </span>
                  {renderValue(item, [...path, index.toString()], level + 1, canEdit)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      const isExpanded = expandedState[currentPath] !== false;

      return (
        <div>
          <span
            className="cursor-pointer select-none text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            onClick={() => toggleExpand(currentPath)}
          >
            {isExpanded ? '▼' : '▶'} Object{keys.length > 0 ? `{${keys.length}}` : '{}'}
          </span>

          {isExpanded && keys.length > 0 && (
            <div className="pl-4 border-l border-zinc-200 dark:border-zinc-800 ml-2">
              {keys.map(key => (
                <div key={key} className="my-1">
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">"{key}"</span>: {renderValue(value[key], [...path, key], level + 1, canEdit)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  if (isEditing) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            <button
              onClick={formatJson}
              className="btn btn-sm btn-secondary"
            >
              Format
            </button>
            <button
              onClick={minifyJson}
              className="btn btn-sm btn-secondary"
            >
              Minify
            </button>
            <button
              onClick={copyToClipboard}
              className="btn btn-sm btn-secondary"
            >
              Copy
            </button>
          </div>
          <div className="flex gap-1.5">
            <button onClick={saveEdit} className="btn btn-sm btn-primary">
              Save
            </button>
            <button onClick={cancelEdit} className="btn btn-sm btn-secondary">
              Cancel
            </button>
          </div>
        </div>

        <textarea
          className="w-full h-96 p-4 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono text-xs leading-relaxed resize-none focus:outline-none"
          value={editableValue}
          onChange={(e) => setEditableValue(e.target.value)}
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {editable && (
        <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">
          <button
            onClick={() => handleEdit([])}
            className="btn btn-sm btn-secondary"
          >
            Edit JSON
          </button>
        </div>
      )}
      <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 overflow-auto max-h-96 font-mono text-xs leading-relaxed">
        {renderValue(data)}
      </div>
    </div>
  );
}
