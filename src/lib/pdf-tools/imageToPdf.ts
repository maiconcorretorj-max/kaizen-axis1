import { jsPDF } from 'jspdf';

export interface ImageToPdfOptions {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'fit';
}

/**
 * Converts multiple images into a single PDF document.
 */
export async function imageToPdf(files: File[], options: ImageToPdfOptions = { orientation: 'portrait', format: 'a4' }): Promise<Blob> {
    const doc = new jsPDF({
        orientation: options.orientation === 'landscape' ? 'l' : 'p',
        unit: 'mm',
        format: options.format === 'a4' ? 'a4' : undefined,
    });

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imgData = await fileToDataUrl(file);

        // Add new page for subsequent images
        if (i > 0) {
            doc.addPage();
        }

        // Get A4 dimensions in mm format (default in jsPDF)
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // In 'fit' or standardized 'a4' mode, we simply draw the image scaling it to fit the page 
        // while maintaining aspect ratio, or filling the page.
        doc.addImage(imgData, file.type === 'image/png' ? 'PNG' : 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    return doc.output('blob');
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
