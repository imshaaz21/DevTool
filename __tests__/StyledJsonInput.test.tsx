import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StyledJsonInput } from '@/components/StyledJsonInput';

describe('StyledJsonInput Component', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders title, placeholder, and empty badge when value is empty', () => {
    render(
      <StyledJsonInput
        title="Sample Editor"
        value=""
        onChange={jest.fn()}
        placeholder="Type JSON here..."
      />
    );

    expect(screen.getByText('Sample Editor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type JSON here...')).toBeInTheDocument();
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('1 line')).toBeInTheDocument();
  });

  it('detects valid JSON object and displays key count badge', () => {
    const validJson = JSON.stringify({ name: 'DevTools', version: 2 }, null, 2);
    render(
      <StyledJsonInput
        title="Input"
        value={validJson}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText(/Valid JSON \(2 keys\)/i)).toBeInTheDocument();
  });

  it('detects valid JSON array and displays item count badge', () => {
    const validJson = JSON.stringify(['alpha', 'beta', 'gamma']);
    render(
      <StyledJsonInput
        title="Array Input"
        value={validJson}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText(/Valid JSON \(3 items\)/i)).toBeInTheDocument();
  });

  it('shows error badge and line/column on invalid JSON', () => {
    const brokenJson = '{\n  "key": "val",\n  "broken":\n}';
    render(
      <StyledJsonInput
        title="Broken Input"
        value={brokenJson}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText(/Error L/i)).toBeInTheDocument();
  });

  it('displays external error message when error prop is provided', () => {
    render(
      <StyledJsonInput
        title="Input"
        value="{}"
        onChange={jest.fn()}
        error="Custom external error message"
      />
    );

    expect(screen.getByText('Custom external error message')).toBeInTheDocument();
  });

  it('formats unformatted JSON when Format button is clicked', () => {
    const handleChange = jest.fn();
    const compactJson = '{"a":1,"b":2}';

    render(
      <StyledJsonInput
        title="Input"
        value={compactJson}
        onChange={handleChange}
      />
    );

    const formatBtn = screen.getByTitle('Format JSON (2 spaces)');
    fireEvent.click(formatBtn);

    expect(handleChange).toHaveBeenCalledWith(
      JSON.stringify({ a: 1, b: 2 }, null, 2)
    );
  });

  it('minifies formatted JSON when Minify button is clicked', () => {
    const handleChange = jest.fn();
    const prettyJson = '{\n  "a": 1,\n  "b": 2\n}';

    render(
      <StyledJsonInput
        title="Input"
        value={prettyJson}
        onChange={handleChange}
      />
    );

    const minifyBtn = screen.getByTitle('Minify JSON (compact)');
    fireEvent.click(minifyBtn);

    expect(handleChange).toHaveBeenCalledWith('{"a":1,"b":2}');
  });

  it('toggles wrap mode when Wrap button is clicked', () => {
    render(
      <StyledJsonInput
        title="Input"
        value="line 1"
        onChange={jest.fn()}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toContain('overflow-x-auto');

    const wrapBtn = screen.getByTitle('Enable line wrap');
    fireEvent.click(wrapBtn);

    expect(textarea.className).toContain('whitespace-pre-wrap');
  });

  it('handles Tab key to indent with 2 spaces', () => {
    function ControlledTestInput() {
      const [val, setVal] = useState('first line');
      return (
        <StyledJsonInput
          title="Input"
          value={val}
          onChange={setVal}
        />
      );
    }

    render(<ControlledTestInput />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    textarea.focus();
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;

    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

    expect(textarea.value).toBe('  first line');
  });

  it('handles Shift+Tab key to unindent 2 spaces', () => {
    function ControlledTestInput() {
      const [val, setVal] = useState('    indented line');
      return (
        <StyledJsonInput
          title="Input"
          value={val}
          onChange={setVal}
        />
      );
    }

    render(<ControlledTestInput />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    textarea.focus();
    textarea.selectionStart = 2;
    textarea.selectionEnd = 2;

    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true });

    expect(textarea.value).toBe('  indented line');
  });

  it('calls onChange with empty string when Clear button is clicked', () => {
    const handleChange = jest.fn();
    render(
      <StyledJsonInput
        title="Input"
        value='{"test": 123}'
        onChange={handleChange}
      />
    );

    const clearBtn = screen.getByTitle('Clear text');
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('copies text to clipboard and shows Copied state', async () => {
    render(
      <StyledJsonInput
        title="Input"
        value='{"copy": "me"}'
        onChange={jest.fn()}
      />
    );

    const copyBtn = screen.getByTitle('Copy JSON to clipboard');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{"copy": "me"}');
    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('disables actions when readOnly is true', () => {
    render(
      <StyledJsonInput
        title="Read Only"
        value='{"data": 1}'
        onChange={jest.fn()}
        readOnly={true}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute('readonly');

    const formatBtn = screen.getByTitle('Format JSON (2 spaces)');
    expect(formatBtn).toBeDisabled();

    const minifyBtn = screen.getByTitle('Minify JSON (compact)');
    expect(minifyBtn).toBeDisabled();

    const clearBtn = screen.getByTitle('Clear text');
    expect(clearBtn).toBeDisabled();
  });
});
