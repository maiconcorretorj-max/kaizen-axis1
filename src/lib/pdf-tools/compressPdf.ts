import { PDFDocument } from 'pdf-lib';

/**
 * Compresses a PDF by removing metadata and object streams.
 * Uses only pdf-lib (no worker needed).
 * True rasterization compression requires server-side tooling.
 */
export async function compressPdf(file: File, quality: number = 0.5): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    // Strip metadata to reduce size
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');

    // Save with or without object streams based on desired quality
    const pdfBytes = await pdf.save({ useObjectStreams: quality < 0.8 });
    return new Blob([pdfBytes], { type: 'application/pdf' });
}
