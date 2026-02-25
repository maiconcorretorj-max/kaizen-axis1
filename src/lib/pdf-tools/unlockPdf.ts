import { PDFDocument } from 'pdf-lib';

/**
 * Unlocks a password-protected PDF.
 * Returns a new PDF blob without the password.
 */
export async function unlockPdf(file: File, password: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();

    // PDF-lib supports decrypting a document if you provide the correct password
    const pdf = await PDFDocument.load(arrayBuffer, { password });

    // Save it back. By default, pdf-lib saves docs without encryption.
    const pdfBytes = await pdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}
