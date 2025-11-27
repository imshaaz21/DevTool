'use client';

import { useMemo } from 'react';

interface DiffLine {
    lineNumber: number;
    content: string;
    type: 'added' | 'removed' | 'unchanged' | 'modified';
}

interface JsonDiffViewerProps {
    jsonA: any;
    jsonB: any;
}

export function JsonDiffViewer({ jsonA, jsonB }: JsonDiffViewerProps) {
    const diffLines = useMemo(() => {
        const linesA = JSON.stringify(jsonA, null, 2).split('\n');
        const linesB = JSON.stringify(jsonB, null, 2).split('\n');

        const result: { lineA: DiffLine | null; lineB: DiffLine | null }[] = [];
        const maxLines = Math.max(linesA.length, linesB.length);

        for (let i = 0; i < maxLines; i++) {
            const contentA = i < linesA.length ? linesA[i] : '';
            const contentB = i < linesB.length ? linesB[i] : '';

            let typeA: DiffLine['type'] = 'unchanged';
            let typeB: DiffLine['type'] = 'unchanged';

            if (contentA !== contentB) {
                if (!contentA && contentB) {
                    typeA = 'removed';
                    typeB = 'added';
                } else if (contentA && !contentB) {
                    typeA = 'removed';
                    typeB = 'added';
                } else {
                    typeA = 'modified';
                    typeB = 'modified';
                }
            }

            result.push({
                lineA: contentA ? { lineNumber: i + 1, content: contentA, type: typeA } : null,
                lineB: contentB ? { lineNumber: i + 1, content: contentB, type: typeB } : null,
            });
        }

        return result;
    }, [jsonA, jsonB]);

    const getLineClassName = (type: DiffLine['type']) => {
        switch (type) {
            case 'added':
                return 'bg-green-900/30 border-l-4 border-green-500';
            case 'removed':
                return 'bg-red-900/30 border-l-4 border-red-500';
            case 'modified':
                return 'bg-yellow-900/30 border-l-4 border-yellow-500';
            default:
                return 'bg-slate-800/20';
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            {/* JSON A Side */}
            <div className="border border-red-500/50 rounded-lg overflow-hidden">
                <div className="bg-red-900/20 px-4 py-2 font-semibold text-red-400 border-b border-red-500/50">
                    JSON A
                </div>
                <div className="max-h-[600px] overflow-auto bg-slate-900">
                    {diffLines.map((diff, idx) => (
                        <div
                            key={idx}
                            className={`flex ${diff.lineA ? getLineClassName(diff.lineA.type) : 'bg-slate-800/20'} ${!diff.lineA ? 'opacity-30' : ''
                                }`}
                        >
                            <div className="px-3 py-1 text-slate-500 select-none w-12 flex-shrink-0 text-right">
                                {diff.lineA?.lineNumber || ''}
                            </div>
                            <div className="px-3 py-1 flex-1 whitespace-pre overflow-x-auto">
                                {diff.lineA?.content || '\u00A0'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* JSON B Side */}
            <div className="border border-green-500/50 rounded-lg overflow-hidden">
                <div className="bg-green-900/20 px-4 py-2 font-semibold text-green-400 border-b border-green-500/50">
                    JSON B
                </div>
                <div className="max-h-[600px] overflow-auto bg-slate-900">
                    {diffLines.map((diff, idx) => (
                        <div
                            key={idx}
                            className={`flex ${diff.lineB ? getLineClassName(diff.lineB.type) : 'bg-slate-800/20'} ${!diff.lineB ? 'opacity-30' : ''
                                }`}
                        >
                            <div className="px-3 py-1 text-slate-500 select-none w-12 flex-shrink-0 text-right">
                                {diff.lineB?.lineNumber || ''}
                            </div>
                            <div className="px-3 py-1 flex-1 whitespace-pre overflow-x-auto">
                                {diff.lineB?.content || '\u00A0'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
