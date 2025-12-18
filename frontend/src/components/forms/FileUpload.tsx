import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn, formatFileSize } from "@/utils";
import { MAX_FILE_SIZE } from "@/utils/constants";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  isUploading?: boolean;
  progress?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  onError,
  maxSize = MAX_FILE_SIZE,
  isUploading = false,
  progress = 0,
  disabled = false,
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const error = rejection.errors[0];

        if (error.code === "file-too-large") {
          onError?.(
            `File is too large. Maximum size is ${formatFileSize(maxSize)}.`
          );
        } else if (error.code === "file-invalid-type") {
          onError?.("Invalid file type. Please upload a CSV or Excel file.");
        } else {
          onError?.(error.message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, onError, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxSize,
    multiple: false,
    disabled: disabled || isUploading,
  });

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl p-8 transition-all duration-200",
          "border-2 border-dashed border-subtle",
          "bg-surface/90 backdrop-blur-sm",
          "shadow-[0_16px_60px_rgba(15,23,42,0.08)]",
          isDragActive
            ? "border-primary-300 bg-primary-50/60 dark:bg-primary-900/10"
            : "hover:border-primary-200 hover:shadow-[0_18px_70px_rgba(15,23,42,0.1)]",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed",
          !disabled && !isUploading && "cursor-pointer"
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {selectedFile && !isUploading ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-info-100 dark:from-primary-900/30 dark:to-info-900/25 flex items-center justify-center shadow-[0_12px_30px_rgba(63,130,244,0.18)]">
                <DocumentIcon className="w-6 h-6 text-primary-600 dark:text-primary-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="p-2 rounded-lg text-muted hover:text-error-500 hover:bg-error-50 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </motion.div>
          ) : isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-info-100 dark:from-primary-900/30 dark:to-info-900/25 flex items-center justify-center mb-4 shadow-[0_12px_30px_rgba(63,130,244,0.18)]">
                <CloudArrowUpIcon className="w-6 h-6 text-primary-600 dark:text-primary-300 animate-bounce" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Uploading...
              </p>
              <div className="w-full max-w-xs h-2 rounded-full bg-sunken overflow-hidden">
                <motion.div
                  className="h-full bg-primary-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted mt-2">{progress}%</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50/80 dark:bg-primary-900/20 flex items-center justify-center mb-4 text-muted-foreground shadow-[0_10px_24px_rgba(63,130,244,0.12)]">
                <CloudArrowUpIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {isDragActive
                  ? "Drop your file here"
                  : "Drag & drop your file here"}
              </p>
              <p className="text-xs text-muted mb-3">or click to browse</p>
              <p className="text-xs text-tertiary">
                Supports CSV, XLSX, XLS (max {formatFileSize(maxSize)})
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FileUpload;
