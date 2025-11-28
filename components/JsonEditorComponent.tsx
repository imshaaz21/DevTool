'use client';

import { useEffect, useRef } from 'react';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

interface JsonEditorProps {
    json: any;
    onChange: (json: any) => void;
    mode?: 'tree' | 'code' | 'view' | 'form' | 'text';
    height?: string;
    readOnly?: boolean;
}

export function JsonEditorComponent({
    json,
    onChange,
    mode = 'code',
    height = '400px',
    readOnly = false
}: JsonEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<JSONEditor | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const options: JSONEditorOptions = {
            mode: mode,
            modes: ['tree', 'code', 'view', 'form', 'text'], // Allow all modes
            theme: 'ace/theme/monokai', // Dark theme
            onChange: () => {
                if (!readOnly) {
                    try {
                        if (editorRef.current) {
                            const updatedJson = editorRef.current.get();
                            onChange(updatedJson);
                        }
                    } catch (e) {
                        // Invalid JSON, ignore
                    }
                }
            },
            onError: (err: any) => {
                console.error('JSON Editor Error:', err);
            },
            mainMenuBar: true,
            navigationBar: false,
            statusBar: true,
            enableSort: false,
            enableTransform: false,
        };

        editorRef.current = new JSONEditor(containerRef.current, options);
        editorRef.current.set(json);

        return () => {
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, [mode, readOnly]);

    // Update editor when json prop changes
    useEffect(() => {
        if (editorRef.current) {
            try {
                const currentJson = editorRef.current.get();
                if (JSON.stringify(currentJson) !== JSON.stringify(json)) {
                    editorRef.current.set(json);
                }
            } catch (e) {
                editorRef.current.set(json);
            }
        }
    }, [json]);

    return (
        <div
            ref={containerRef}
            style={{ height }}
            className="jsoneditor-react-container border border-slate-700 rounded-md shadow-lg"
        />
    );
}
