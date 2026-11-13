/**
 * HTTP shaping for documents — not domain types.
 */
import { listDocumentsForUser } from '../../models/document'

type DocumentRow = Awaited<ReturnType<typeof listDocumentsForUser>>[number]

export function documentDto(doc: DocumentRow) {
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
