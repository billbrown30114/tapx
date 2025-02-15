'use client';

import { FileUpload } from '@/components/FileUpload';
import { toast } from 'react-hot-toast';

export default function ResumeUploadPage() {
  const handleUploadComplete = (url: string) => {
    console.log('Resume uploaded:', url);
    toast.success('Resume uploaded successfully');
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload failed:', error);
    toast.error('Failed to upload resume');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Upload</h1>
            <p className="text-gray-600">
              Upload your resume in PDF, DOC, or DOCX format. Maximum file size is 5MB.
            </p>
          </div>

          <FileUpload
            directory="resumes"
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            acceptedFileTypes=".pdf,.doc,.docx"
            maxSizeMB={5}
          />

          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Accepted File Types:</h2>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>PDF documents (.pdf)</li>
              <li>Microsoft Word documents (.doc, .docx)</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 