import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'connectseniors/resumes';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using a Promise wrapper
    const result: any = await new Promise((resolve, reject) => {
      // Create a safe string for the public ID
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const publicId = `${Date.now()}_${safeFilename}`;
      
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: folder, 
          resource_type: 'image', // Use 'image' for PDFs to bypass untrusted raw file restrictions on free tier
          public_id: publicId
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const secureUrl = result.secure_url;
    const numPages = result.pages || 1;
    const urls: string[] = [];

    // Cloudinary can generate images of each PDF page by inserting 'pg_X' into the URL and replacing the extension with .jpg
    for (let i = 1; i <= numPages; i++) {
        let pageUrl = secureUrl.replace('/upload/', `/upload/pg_${i}/`);
        pageUrl = pageUrl.replace(/\.pdf$/i, '.jpg');
        urls.push(pageUrl);
    }

    return NextResponse.json({ urls }, { status: 200 });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
