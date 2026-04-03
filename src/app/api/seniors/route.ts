import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'seniors_db.json');

function getDbData() {
  if (fs.existsSync(dataFile)) {
    try {
      return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

export async function GET() {
  try {
    return NextResponse.json(getDbData());
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let data = getDbData();
    data.unshift(body);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write POST' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    try {
      const body = await request.json();
      let data = getDbData();
      const index = data.findIndex((s: any) => s.id === body.id);
      if (index !== -1) {
          data[index] = body;
      }
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      return NextResponse.json(body);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to write PUT' }, { status: 500 });
    }
  }

  export async function DELETE(request: Request) {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
      let data = getDbData();
      data = data.filter((s: any) => s.id !== id);
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to write DELETE' }, { status: 500 });
    }
  }
