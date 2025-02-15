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

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { resumeId: string } }  // Properly typed params
// ): Promise<NextResponse> {
//   const { resumeId } = params;

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const  m = request; 
  const resumeId = "";

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Prefix: `updates/${resumeId}/`,
      MaxKeys: 1,
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return NextResponse.json({ error: 'No resume found' }, { status: 404 });
    }

    const fileKey = listResponse.Contents[0].Key!;

    const getCommand = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
  }
}