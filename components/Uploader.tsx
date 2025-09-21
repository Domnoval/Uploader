'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface UploadedFile {
  filename: string;
  uniqueFilename?: string;
  thumbnailFilename?: string;
  size: number;
  type: string;
  dimensions?: { width: number; height: number };
  uploadPath?: string;
  thumbnailPath?: string;
  success: boolean;
  error?: string;
  processing?: boolean;
}

interface UploaderProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  className?: string;
}

export function Uploader({ onUploadComplete, maxFiles = 10, className = '' }: UploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    // Add files to state with processing status
    const initialFiles: UploadedFile[] = acceptedFiles.map(file => ({
      filename: file.name,
      size: file.size,
      type: file.type,
      success: false,
      processing: true,
    }));

    setUploadedFiles(prev => [...prev, ...initialFiles]);

    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      setProgress(100);

      // Update uploaded files with results
      setUploadedFiles(prev => {
        const updated = [...prev];
        const startIndex = updated.length - acceptedFiles.length;

        result.files.forEach((fileResult: UploadedFile, index: number) => {
          updated[startIndex + index] = {
            ...fileResult,
            processing: false,
          };
        });

        return updated;
      });

      onUploadComplete?.(result.files);

    } catch (error) {
      console.error('Upload error:', error);

      // Mark files as failed
      setUploadedFiles(prev => {
        const updated = [...prev];
        const startIndex = updated.length - acceptedFiles.length;

        for (let i = 0; i < acceptedFiles.length; i++) {
          updated[startIndex + i] = {
            ...updated[startIndex + i],
            processing: false,
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
          };
        }

        return updated;
      });
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive, rejectedFiles } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.tiff', '.tif'],
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading,
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          <Upload className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />

          {isDragActive ? (
            <p className="text-lg text-blue-600">Drop your artwork here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-600 mb-2">
                Drag & drop your artwork here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports: JPEG, PNG, WEBP, TIFF • Max: 50MB per file • Up to {maxFiles} files
              </p>
            </div>
          )}

          {isUploading && (
            <div className="w-full max-w-xs">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Uploading... {progress}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejected Files */}
      {rejectedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-semibold mb-2">Rejected Files:</h4>
          {rejectedFiles.map((rejected, index) => (
            <div key={index} className="text-sm text-red-700">
              {rejected.file.name}: {rejected.errors[0]?.message}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">
            Uploaded Files ({uploadedFiles.length})
          </h3>

          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 border rounded-lg bg-white shadow-sm"
              >
                {/* Thumbnail or Icon */}
                <div className="flex-shrink-0">
                  {file.thumbnailPath ? (
                    <img
                      src={file.thumbnailPath}
                      alt={file.filename}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-grow">
                  <h4 className="font-medium text-gray-900">{file.filename}</h4>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Size: {formatFileSize(file.size)}</p>
                    {file.dimensions && (
                      <p>Dimensions: {file.dimensions.width} × {file.dimensions.height} px</p>
                    )}
                    {file.type && <p>Type: {file.type}</p>}
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0 flex items-center space-x-2">
                  {file.processing ? (
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  ) : file.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}

                  {!file.processing && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}