"use client";

import { useMemo, useRef, useState } from "react";

type FileUploadProps = {
  onFilesSelected?: (files: File[]) => void;
  acceptedExtensions?: string[];
};

type FileError = {
  fileName: string;
  reason: string;
};

export default function FileUpload({
  onFilesSelected,
  acceptedExtensions = [".pbn", ".json", ".txt"],
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FileError[]>([]);

  const acceptAttr = useMemo(() => acceptedExtensions.join(","), [acceptedExtensions]);

  function hasAcceptedExtension(file: File, extensions: string[]) {
    const lowerName = file.name.toLowerCase();
    return extensions.some((ext) => lowerName.endsWith(ext.toLowerCase()));
  }

  function handleSelectedFiles(fileList: FileList | null) {
    if (!fileList) return;

    const incomingFiles = Array.from(fileList);
    const validFiles: File[] = [];
    const nextErrors: FileError[] = [];

    for (const file of incomingFiles) {
      if (!hasAcceptedExtension(file, acceptedExtensions)) {
        nextErrors.push({
          fileName: file.name,
          reason: `Unsupported file type. Allowed: ${acceptedExtensions.join(", ")}`,
        });
        continue;
      }
      validFiles.push(file);
    }

    setFiles((prevFiles) => {
      const merged = [...prevFiles];
      const existingKeys = new Set(
        prevFiles.map((f) => `${f.name}-${f.lastModified}-${f.size}`)
      );

      for (const file of validFiles) {
        const key = `${file.name}-${file.lastModified}-${file.size}`;
        if (!existingKeys.has(key)) {
          merged.push(file);
          existingKeys.add(key);
        } else {
          nextErrors.push({ fileName: file.name, reason: "File already added" });
        }
      }

      onFilesSelected?.(merged);
      return merged;
    });

    setErrors((prev) => [...prev, ...nextErrors]);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleSelectedFiles(event.target.files);
  }

  function clearFiles() {
    setFiles([]);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
    onFilesSelected?.([]);
  }

  return (
    <section className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Upload competition files</h2>
          <p className="text-sm text-zinc-400">
            Select one or more result files to analyze.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptAttr}
            onChange={handleInputChange}
            className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border file:border-zinc-600 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:text-zinc-300 file:cursor-pointer"
          />

          <button
            type="button"
            onClick={clearFiles}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-400 transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-white">Uploaded files</h3>

          {files.length === 0 ? (
            <p className="text-sm text-zinc-500">No files selected yet.</p>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={`${file.name}-${file.lastModified}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm"
                >
                  <div className="font-medium text-white">{file.name}</div>
                  <div className="text-zinc-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-red-800 bg-red-950 p-4">
            <h3 className="font-medium text-red-400">Upload errors</h3>
            <ul className="mt-2 space-y-2 text-sm text-red-300">
              {errors.map((error, index) => (
                <li key={`${error.fileName}-${index}`}>
                  <span className="font-medium">{error.fileName}</span>: {error.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
