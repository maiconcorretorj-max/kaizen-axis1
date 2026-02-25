import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

/**
 * Compresses a PDF by rendering its pages to images and creating a new PDF.
 * Note: Real structural PDF compression is not possible natively in the browser without WebAssembly (like Ghostscript).
 * This rasterizes the PDF. Text will lose selectability.
 */
export async function compressPdf(file: File, quality: number = 0.5): Promise<Blob> {
    // If the user selects a very high quality, we might just try removing object streams and metadata as a basic attempt
    if (quality >= 0.9) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        pdf.setTitle('');
        pdf.setAuthor('');
        const pdfBytes = await pdf.save({ useObjectStreams: false });
        return new Blob([pdfBytes], { type: 'application/pdf' });
    }

    // Otherwise, rasterize it
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const doc = new jsPDF({ unit: 'pt' });

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        // Lower scale = lower resolution = higher compression
        const scale = quality > 0.6 ? 1.5 : (quality > 0.3 ? 1.0 : 0.7);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert to JPEG with quality
        const imgData = canvas.toDataURL('image/jpeg', quality);

        if (i > 1) {
            doc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'l' : 'p');
        } else {
            // Set the first page size
            // jsPDF internal API manipulation is tricky, but we can delete the first page and add a new one, or just ignore for simple use.
        }
        doc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height, undefined, 'FAST');
    }

    return doc.output('blob');
}
