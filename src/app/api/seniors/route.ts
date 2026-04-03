import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'seniors_db.json');

export async function GET() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let data: any[] = [];
    if (fs.existsSync(dataFile)) {
      data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    data.unshift(body);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write' }, { status: 500 });
  }
}
