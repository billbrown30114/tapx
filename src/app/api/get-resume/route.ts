import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
  }
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
    }

    // Look for a file with the ID as its name in the updates folder
    const fileKey = `updates/${id}/${id}`; // This will look for /updates/3456789/3456789.pdf (or other extension)
    
    // List objects to find the exact file with any extension
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Prefix: fileKey,
      MaxKeys: 1
    });

    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.error('No file found with prefix:', fileKey);
      return NextResponse.json({ error: 'No resume found' }, { status: 404 });
    }

    // Get the exact file key (including extension)
    const exactFileKey = listResponse.Contents[0].Key;
    console.log('Found file:', exactFileKey);
    
    // Generate signed URL
    const getCommand = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: exactFileKey
    });

    // Generate a signed URL that expires in 1 hour
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    console.log('Generated signed URL for:', exactFileKey);

    return NextResponse.json({ url });

  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
} 