import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../ui/button';

export const FileDropzone = ({
  disabled,
  onUpload,
}: {
  disabled: boolean;
  onUpload: (file: File) => Promise<void>;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || disabled) return;
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      className="rounded-xl border border-dashed border-border/50 bg-card p-6 text-center"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <FileUp className="mx-auto h-8 w-8 text-primary" />
      <p className="mt-3 font-medium">Upload a secure PDF report</p>
      <p className="mt-2 text-sm text-foreground/60">PDF only, up to 20MB. Select a patient before uploading.</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <Button className="mt-4" disabled={disabled || isUploading} onClick={() => inputRef.current?.click()}>
        {isUploading ? 'Uploading…' : disabled ? 'Select a patient first' : 'Choose PDF'}
      </Button>
    </div>
  );
};
