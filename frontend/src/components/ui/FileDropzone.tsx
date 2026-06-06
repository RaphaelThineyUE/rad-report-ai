/**
 * Drag-and-drop file upload zone with hidden file input.
 * Props: accept? (MIME type, default 'application/pdf'), multiple? (default true),
 *   disabled?, onFilesSelected ((files: File[]) => void).
 * Highlights on drag-over, resets input value after selection so the same file
 * can be re-selected. Shows a HIPAA notice footer.
 */
import { useRef, useState } from 'react';
import { Icon } from './Icon';

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function FileDropzone({
  accept = 'application/pdf',
  multiple = true,
  disabled = false,
  onFilesSelected,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }

  function handleClick() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: '1.5px dashed var(--border-2)',
          borderRadius: 'var(--r-lg)',
          padding: '44px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragOver
            ? 'var(--rose-50)'
            : 'var(--grad-mesh), var(--bg-surface)',
          transition: 'all var(--dur-fast)',
          opacity: disabled ? 0.6 : 1,
          borderColor: isDragOver ? 'var(--rose-400)' : 'var(--border-2)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--rose-600)',
          }}
        >
          <Icon name="file-up" size={26} />
        </div>
        <div className="t-h4" style={{ marginBottom: 6 }}>
          {isDragOver ? 'Drop PDFs here' : 'Drop radiology PDFs here'}
        </div>
        <div className="t-body-sm" style={{ marginBottom: 18 }}>
          or click to browse · encrypted in transit and at rest
        </div>
        <button
          type="button"
          style={{
            background: 'var(--rose-600)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--r-md)',
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          Choose files
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 20,
            color: 'var(--fg-4)',
            fontSize: 11.5,
          }}
        >
          <Icon name="shield" size={13} /> HIPAA-aligned · audit-logged
        </div>
      </div>
    </>
  );
}
