/**
 * HTTP shaping for documents — not domain types.
 * /api handlers and page getData both call documentDto — one JSON shape.
 */
import { listDocumentsForUser } from '../../models/document'

type DocumentRow = Awaited<ReturnType<typeof listDocumentsForUser>>[number]

export type DocumentDto = {
  id: string
  filename: string
  contentType: string
  byteSize: number
  status: string
  extractedTextLength: number | null
  createdAt: string
  updatedAt: string
}

export function documentDto(doc: DocumentRow): DocumentDto {
  return {
    id: doc.id,
    filename: doc.filename,
    contentType: doc.contentType,
    byteSize: doc.byteSize,
    status: doc.status,
    extractedTextLength: doc.extractedText?.length ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
