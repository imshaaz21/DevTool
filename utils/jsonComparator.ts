/**
 * JSON Key Comparator Utilities
 * 
 * This file contains utility functions for comparing JSON objects and identifying differences.
 */

// Get all keys from an object recursively
export function getAllKeys(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }

  let keys: string[] = [];

  Object.keys(obj).forEach(key => {
    const currentKey = prefix ? `${prefix}.${key}` : key;
    keys.push(currentKey);

    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      // Recursively get keys from nested objects
      keys = [...keys, ...getAllKeys(obj[key], currentKey)];
    } else if (Array.isArray(obj[key])) {
      // For arrays, check if they contain objects and get keys from those
      obj[key].forEach((item: any, index: number) => {
        if (item && typeof item === 'object') {
          keys = [...keys, ...getAllKeys(item, `${currentKey}[${index}]`)];
        }
      });
    }
  });

  return keys;
}

// Compare two JSON objects and return the differences
export function compareJsonObjects(jsonA: any, jsonB: any) {
  const keysA = getAllKeys(jsonA);
  const keysB = getAllKeys(jsonB);

  // Find keys in A that are not in B
  const keysOnlyInA = keysA.filter(key => !keysB.includes(key));

  // Find keys in B that are not in A
  const keysOnlyInB = keysB.filter(key => !keysA.includes(key));

  // Find keys in both
  const keysInBoth = keysA.filter(key => keysB.includes(key));

  // Separate keys with same values from keys with different values
  const commonKeysWithSameValue: string[] = [];
  const valueDiffs = keysInBoth.filter(key => {
    const valueA = getValueByPath(jsonA, key);
    const valueB = getValueByPath(jsonB, key);

    // Handle special cases like null, undefined, NaN
    if (valueA === null || valueA === undefined || valueB === null || valueB === undefined) {
      const isDifferent = valueA !== valueB;
      if (!isDifferent) {
        commonKeysWithSameValue.push(key);
      }
      return isDifferent;
    }

    // Compare objects and arrays by stringifying
    if (typeof valueA === 'object' && typeof valueB === 'object') {
      const isDifferent = JSON.stringify(valueA) !== JSON.stringify(valueB);
      if (!isDifferent) {
        commonKeysWithSameValue.push(key);
      }
      return isDifferent;
    }

    // Simple value comparison
    const isDifferent = valueA !== valueB;
    if (!isDifferent) {
      commonKeysWithSameValue.push(key);
    }
    return isDifferent;
  }).map(key => ({
    key,
    valueA: getValueByPath(jsonA, key),
    valueB: getValueByPath(jsonB, key)
  }));

  return {
    keysOnlyInA,
    keysOnlyInB,
    keysInBoth,
    commonKeysWithSameValue,
    valueDiffs,
    totalKeysA: keysA.length,
    totalKeysB: keysB.length
  };
}

// Get a nested value from an object using a dot-notation path
export function getValueByPath(obj: any, path: string): any {
  // Handle array notation like "users[0].name"
  const arrayMatch = path.match(/^(.*?)\[(\d+)\](.*)$/);
  if (arrayMatch) {
    const [, arrayPath, indexStr, restPath] = arrayMatch;
    const index = parseInt(indexStr, 10);
    const array = arrayPath ? getValueByPath(obj, arrayPath) : obj;

    if (!Array.isArray(array) || index >= array.length) {
      return undefined;
    }

    const item = array[index];
    if (restPath) {
      // Remove the leading dot
      return getValueByPath(item, restPath.substring(1));
    }
    return item;
  }

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

// Pretty print JSON with proper indentation
export function prettyPrintJson(json: any): string {
  return JSON.stringify(json, null, 2);
}

// Create a tree structure from a flat list of keys
export interface TreeNode {
  name: string;
  children?: TreeNode[];
  value?: any;
  path?: string;
  status?: 'added' | 'removed' | 'unchanged';
}

export function createTreeFromKeys(keys: string[], json: any, status?: 'added' | 'removed' | 'unchanged'): TreeNode {
  const root: TreeNode = { name: 'root', children: [] };

  keys.forEach(key => {
    const parts = key.split('.');
    let currentNode = root;

    parts.forEach((part, index) => {
      // Handle array notation
      const arrayMatch = part.match(/^(.*?)\[(\d+)\]$/);
      let nodeName = part;
      let arrayIndex: number | null = null;

      if (arrayMatch) {
        const [, arrayName, indexStr] = arrayMatch;
        nodeName = arrayName || part;
        arrayIndex = parseInt(indexStr, 10);
      }

      // Find or create the node for this part
      let childNode = currentNode.children?.find(child => child.name === nodeName);

      if (!childNode) {
        childNode = { name: nodeName, children: [] };
        currentNode.children?.push(childNode);
      }

      // If this is an array node, make sure it has children for the array items
      if (arrayIndex !== null) {
        if (!childNode.children) {
          childNode.children = [];
        }

        // Find or create the array item node
        let arrayItemNode = childNode.children.find(child =>
          child.name === `[${arrayIndex}]`
        );

        if (!arrayItemNode) {
          arrayItemNode = {
            name: `[${arrayIndex}]`,
            children: [],
            path: parts.slice(0, index + 1).join('.')
          };
          childNode.children.push(arrayItemNode);
        }

        // Continue with the array item as the current node
        currentNode = arrayItemNode;
      } else {
        currentNode = childNode;
      }

      // If this is the last part, set the value and status
      if (index === parts.length - 1) {
        currentNode.path = key;
        currentNode.value = getValueByPath(json, key);
        if (status) {
          currentNode.status = status;
        }
      }
    });
  });

  return root;
}

// Merge two trees for comparison
export function mergeTrees(treeA: TreeNode, treeB: TreeNode): TreeNode {
  const mergedTree: TreeNode = {
    name: 'root',
    children: []
  };

  // Helper function to add nodes from a source tree to the merged tree
  const addNodesToMergedTree = (sourceNode: TreeNode, status?: 'added' | 'removed' | 'unchanged') => {
    if (!sourceNode.children) return;

    sourceNode.children.forEach(child => {
      // Find if this node already exists in the merged tree
      let mergedNode = mergedTree.children?.find(node => node.name === child.name);

      if (!mergedNode) {
        // Create a new node in the merged tree
        mergedNode = {
          name: child.name,
          children: [],
          path: child.path,
          value: child.value,
          status: status || child.status
        };
        mergedTree.children?.push(mergedNode);
      }

      // Recursively process children
      if (child.children && child.children.length > 0) {
        if (!mergedNode.children) {
          mergedNode.children = [];
        }

        child.children.forEach(grandchild => {
          const mergedGrandchild = {
            ...grandchild,
            status: status || grandchild.status
          };
          mergedNode.children?.push(mergedGrandchild);
        });
      }
    });
  };

  // Add nodes from both trees
  addNodesToMergedTree(treeA, 'removed');  // Keys only in A are marked as 'removed'
  addNodesToMergedTree(treeB, 'added');    // Keys only in B are marked as 'added'

  return mergedTree;
}
