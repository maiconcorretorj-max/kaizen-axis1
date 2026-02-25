/**
 * Protects a PDF with a password.
 * NOTE: pdf-lib natively does not support *encrypting* documents in standard browser environments.
 * This is a placeholder that simulates the workflow. In a real environment, this would hit an Edge Function.
 */
export async function protectPdf(file: File, password: string): Promise<Blob> {
    // Pass-through for now since pdf-lib cannot encrypt local blobs.
    console.warn('Proteção de PDF no navegador não é suportada nativamente pela pdf-lib. O arquivo será retornado sem alteração de metadados de segurança para fins de demonstração da UI.');
    return file;
}
