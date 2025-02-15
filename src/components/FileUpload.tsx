import React, { useState, useRef } from 'react';
import { FileUploadService } from '@/services/fileUpload';

interface FileUploadProps {
  directory: string;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  directory,
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = '*',
  maxSizeMB = 10
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadService = new FileUploadService();

  console.log('Environment check:', {
    hasRegion: !!process.env.NEXT_PUBLIC_AWS_REGION,
    hasAccessKey: !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    hasBucketName: !!process.env.NEXT_PUBLIC_AWS_BUCKET_NAME
  });

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      onUploadError?.(new Error(`File size must be less than ${maxSizeMB}MB`));
      return;
    }

    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const url = await fileUploadService.uploadFile(
        directory,
        file.name,
        buffer,
        file.type
      );
      onUploadComplete?.(url);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`relative flex flex-col items-center justify-center w-full h-64 p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          onChange={handleChange}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M24 8v24m0-24L16 16m8-8l8 8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-base text-gray-600">
              Drag and drop your file here, or click to select
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {acceptedFileTypes === '*' 
                ? `Max file size: ${maxSizeMB}MB`
                : `Accepted files: ${acceptedFileTypes} (Max: ${maxSizeMB}MB)`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
