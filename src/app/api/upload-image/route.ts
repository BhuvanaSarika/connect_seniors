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
    const folder = formData.get('folder') as string || 'connectseniors/profiles';

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
          resource_type: 'auto',
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

    return NextResponse.json({ url: secureUrl }, { status: 200 });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
