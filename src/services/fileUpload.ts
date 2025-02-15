import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import path from 'path';

export class FileUploadService {
  private s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    console.log('Initializing FileUploadService');
    console.log('Environment variables:', {
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      hasAccessKey: !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME
    });

    if (!process.env.NEXT_PUBLIC_AWS_REGION) {
      throw new Error('NEXT_PUBLIC_AWS_REGION is not configured');
    }

    if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are not configured');
    }

    this.bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || 'ingress.tapx';

    try {
      this.s3Client = new S3Client({ 
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
        },
        forcePathStyle: true // Try this if you're having issues with the URL format
      });
      console.log('S3 client initialized successfully');
    } catch (error) {
      console.error('Error initializing S3 client:', error);
      throw error;
    }
  }

  async uploadFile(
    directory: string,
    filename: string,
    file: Buffer | Readable | string,
    contentType?: string
  ): Promise<string> {
    try {
      const cleanDirectory = directory.replace(/^\/+|\/+$/g, '');
      const cleanFilename = filename.replace(/^\/+/g, '');
      const key = path.join(cleanDirectory, cleanFilename).replace(/\\/g, '/');

      console.log('Starting upload:', {
        bucket: this.bucketName,
        key,
        contentType,
        fileSize: file instanceof Buffer ? file.length : 'unknown'
      });

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      console.log('Sending upload command...');
      await this.s3Client.send(command);
      
      const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      console.log('File uploaded successfully:', url);
      return url;
    } catch (error: any) {
      console.error('Detailed upload error:', {
        error,
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      throw new Error(`Failed to upload file: ${error?.message || 'Unknown error'}`);
    }
  }

  async deleteFile(directory: string, filename: string): Promise<void> {
    const cleanDirectory = directory.replace(/^\/+|\/+$/g, '');
    const cleanFilename = filename.replace(/^\/+/g, '');
    const key = path.join(cleanDirectory, cleanFilename).replace(/\\/g, '/');

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file');
    }
  }

  async getSignedUrl(directory: string, filename: string, expiresIn: number = 3600): Promise<string> {
    const cleanDirectory = directory.replace(/^\/+|\/+$/g, '');
    const cleanFilename = filename.replace(/^\/+/g, '');
    const key = path.join(cleanDirectory, cleanFilename).replace(/\\/g, '/');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async listFiles(directory: string): Promise<string[]> {
    const cleanDirectory = directory.replace(/^\/+|\/+$/g, '');
    
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: cleanDirectory ? `${cleanDirectory}/` : '',
    });

    try {
      const response = await this.s3Client.send(command);
      return (response.Contents || [])
        .map(item => item.Key || '')
        .filter(key => key !== '');
    } catch (error) {
      console.error('Error listing files from S3:', error);
      throw new Error('Failed to list files');
    }
  }
} 