import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

// Setup worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Extracts each page of a PDF as a high-quality JPG image and packs them into a ZIP file.
 */
export async function pdfToJpg(file: File): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const zip = new JSZip();

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality extraction

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // @ts-ignore - The types for pdfjs-dist RenderParameters can be very strict
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Get the base64 string
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const base64Data = imgData.split(',')[1];

        zip.file(`pagina_${i}.jpg`, base64Data, { base64: true });
    }

    // Generate the zip blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
}
