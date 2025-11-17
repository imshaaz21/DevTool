'use client';

import { useState } from 'react';
import { useEffect } from 'react';

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
  const [editMode, setEditMode] = useState<'raw' | 'pretty'>('raw');

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

  const updateJsonValue = (path: string[], newValue: any) => {
    try {
      const parsedData = JSON.parse(editableValue);
      let current = parsedData;

      // Navigate to the parent object
      for (let i = 0; i < path.length - 1; i++) {
        const part = path[i];
        if (part.match(/^\d+$/)) {
          // Array index
          current = current[parseInt(part, 10)];
        } else {
          // Object key
          current = current[part];
        }
      }

      // Update the value
      const lastPart = path[path.length - 1];
      if (lastPart.match(/^\d+$/)) {
        current[parseInt(lastPart, 10)] = newValue;
      } else {
        current[lastPart] = newValue;
      }

      // Update the editable value
      setEditableValue(JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('Error updating JSON value:', e);
    }
  };

  const renderValue = (value: any, path: string[] = [], level: number = 0, editable: boolean = false): JSX.Element => {
    const currentPath = path.join('.');

    if (value === null) {
      return editable ? (
        <span 
          className="text-gray-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 px-1 rounded"
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
        <span className="text-gray-500">null</span>
      );
    }

    if (typeof value === 'undefined') {
      return <span className="text-gray-500">undefined</span>;
    }

    if (typeof value === 'boolean') {
      return editable ? (
        <span 
          className="text-yellow-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 px-1 rounded"
          onClick={() => {
            updateJsonValue(path, !value);
          }}
        >
          {value.toString()}
        </span>
      ) : (
        <span className="text-yellow-500">{value.toString()}</span>
      );
    }

    if (typeof value === 'number') {
      return editable ? (
        <span 
          className="text-blue-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 px-1 rounded"
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
        <span className="text-blue-500">{value}</span>
      );
    }

    if (typeof value === 'string') {
      return editable ? (
        <span 
          className="text-green-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 px-1 rounded"
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
        <span className="text-green-500">"{value}"</span>
      );
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedState[currentPath] !== false; // Default to expanded

      return (
        <div>
          <span 
            className="cursor-pointer" 
            onClick={() => toggleExpand(currentPath)}
          >
            {isExpanded ? '▼' : '▶'} Array[{value.length}]
          </span>

          {isExpanded && (
            <div className="pl-4 border-l border-gray-300 dark:border-gray-700 ml-2">
              {value.map((item, index) => (
                <div key={index} className="my-1">
                  <span className="text-gray-500">{index}: </span>
                  {renderValue(item, [...path, index.toString()], level + 1, editable)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      const isExpanded = expandedState[currentPath] !== false; // Default to expanded

      return (
        <div>
          <span 
            className="cursor-pointer" 
            onClick={() => toggleExpand(currentPath)}
          >
            {isExpanded ? '▼' : '▶'} Object{keys.length > 0 ? `{${keys.length}}` : '{}'}
          </span>

          {isExpanded && keys.length > 0 && (
            <div className="pl-4 border-l border-gray-300 dark:border-gray-700 ml-2">
              {keys.map(key => (
                <div key={key} className="my-1">
                  <span className="text-purple-500">"{key}"</span>: {renderValue(value[key], [...path, key], level + 1, editable)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  const renderPrettyEditor = () => {
    try {
      const parsedData = JSON.parse(editableValue);
      return renderValue(parsedData, [], 0, true);
    } catch (e) {
      return (
        <div className="text-red-500">
          Error parsing JSON: {(e as Error).message}
        </div>
      );
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md max-w-full">
        <div className="mb-2 flex gap-2">
          <button 
            onClick={() => setEditMode('raw')} 
            className={`btn btn-sm ${editMode === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Raw Edit
          </button>
          <button 
            onClick={() => setEditMode('pretty')} 
            className={`btn btn-sm ${editMode === 'pretty' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Pretty Edit
          </button>
        </div>

        {editMode === 'raw' ? (
          <textarea
            className="w-full h-64 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono"
            value={editableValue}
            onChange={(e) => setEditableValue(e.target.value)}
          />
        ) : (
          <div className="w-full h-64 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono overflow-auto max-w-full">
            {renderPrettyEditor()}
          </div>
        )}

        <div className="mt-2 flex gap-2">
          <button onClick={saveEdit} className="btn btn-primary">Save</button>
          <button onClick={cancelEdit} className="btn btn-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-96 max-w-full font-mono">
      {editable && (
        <div className="mb-2">
          <button 
            onClick={() => handleEdit([])} 
            className="btn btn-sm btn-secondary"
          >
            Edit JSON
          </button>
        </div>
      )}
      <div className="text-sm">
        {renderValue(data)}
      </div>
    </div>
  );
}
