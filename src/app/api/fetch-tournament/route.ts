import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Missing tournament ID' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://urslit.bridge.is/api/tournaments/GetTournament/${id}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        Referer: `https://urslit.bridge.is/tournament/${id}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tournament: ${response.statusText}`);
    }

    const data = await response.json();
    const eventName = sanitizeFilename(data.event || 'tournament');
    const filename = `${eventName}.json`;

    const saveDir = path.resolve(process.cwd(), 'saved-tournaments');
    await mkdir(saveDir, { recursive: true });

    const filePath = path.join(saveDir, filename);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, filePath, filename, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}
