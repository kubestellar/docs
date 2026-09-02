import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'
import { recordApiRequest } from '@/lib/metrics'

const DOCS_CONTENT_PATH = path.join(process.cwd(), 'docs', 'content')

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startedAt = performance.now()
  let status = 200
  try {
    const { path: pathSegments } = await params
    const imagePath = pathSegments.join('/')

    // Security: prevent directory traversal
    if (imagePath.includes('..')) {
      status = 403
      return new NextResponse('Forbidden', { status })
    }

    const fullPath = path.join(DOCS_CONTENT_PATH, imagePath)

    // Check if file exists and is within docs/content (trailing sep prevents sibling-dir prefix confusion)
    if (!fullPath.startsWith(DOCS_CONTENT_PATH + path.sep)) {
      status = 403
      return new NextResponse('Forbidden', { status })
    }

    if (!fs.existsSync(fullPath)) {
      status = 404
      return new NextResponse('Not Found', { status })
    }

    const ext = path.extname(fullPath).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'

    const fileBuffer = fs.readFileSync(fullPath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    status = 500
    logger.error('docs-image request failed', {
      route: 'docs-image',
      method: 'GET',
      status,
      error: error instanceof Error ? error.message : String(error),
    })
    return new NextResponse('Internal Server Error', { status })
  } finally {
    const durationMs = performance.now() - startedAt
    recordApiRequest('docs-image', 'GET', status, durationMs)
  }
}
