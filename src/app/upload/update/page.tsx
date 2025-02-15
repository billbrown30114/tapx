'use client';

import { FileUpload } from '@/components/FileUpload';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

export default function UpdateUploadPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600 mb-6">Error: No ID provided</h1>
        <p>Please provide an ID in the URL</p>
      </div>
    );
  }

  const handleUploadComplete = (url: string) => {
    console.log('Update uploaded:', url);
    toast.success('Update uploaded successfully');
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload failed:', error);
    toast.error('Failed to upload update');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Update Upload for ID: {id}</h1>
      <FileUpload
        directory={`updates/${id}`}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        acceptedFileTypes=".pdf,.txt"
        maxSizeMB={10}
      />
    </div>
  );
} 