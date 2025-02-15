import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
  try {
    const resumeId = params.resumeId;
    console.log('API: Fetching resume for:', resumeId);
    
    // Create absolute path to the PDF
    const filePath = path.join(process.cwd(), 'resumes', `${resumeId}.pdf`);
    console.log('API: Looking for file at:', filePath);

    // Check if file exists and read it
    try {
      const fileBuffer = await fs.readFile(filePath);
      console.log('API: File found and read successfully');
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
        },
      });
    } catch (error) {
      console.error('API: File not found or error reading file:', error);
      return new NextResponse('PDF not found', { status: 404 });
    }
  } catch (error) {
    console.error('API: Server error:', error);
    return new NextResponse('Server error', { status: 500 });
  }
} 