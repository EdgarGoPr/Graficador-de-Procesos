import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { getGeminiApiKey } from './aiRecommendationService';

// Configuración del worker de PDF.js para Vite
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface ExtractedDocument {
  title: string;
  content: string;
  pageCount?: number;
  wordCount: number;
  method: 'PDF_LOCAL' | 'PDF_GEMINI_OCR' | 'DOCX_LOCAL' | 'TEXT_PLAIN';
  sourceReference: string;
}

export class DocumentExtractorService {
  /**
   * Extrae el contenido de un archivo (PDF, DOCX, TXT, MD, JSON)
   */
  public static async extractDocument(file: File): Promise<ExtractedDocument> {
    const fileName = file.name;
    const baseTitle = fileName.replace(/\.[^/.]+$/, '');
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (extension === 'docx' || extension === 'doc') {
      return await this.extractDocx(file, baseTitle);
    }

    if (extension === 'pdf') {
      return await this.extractPdf(file, baseTitle);
    }

    // Archivo de texto plano / markdown / json
    return await this.extractPlainText(file, baseTitle);
  }

  /**
   * Extrae texto de un archivo Word (.docx) usando mammoth
   */
  private static async extractDocx(file: File, baseTitle: string): Promise<ExtractedDocument> {
    const arrayBuffer = await file.arrayBuffer();

    try {
      // Intentamos extraer como markdown estructurado para preservar títulos y viñetas
      const mdResult = await (mammoth as any).convertToMarkdown({ arrayBuffer });
      let text = mdResult.value?.trim() || '';

      // Si el markdown quedó vacío, intentamos con texto plano
      if (!text) {
        const rawResult = await mammoth.extractRawText({ arrayBuffer });
        text = rawResult.value?.trim() || '';
      }

      if (!text) {
        throw new Error('El archivo DOCX no contiene texto legible.');
      }

      const wordCount = text.split(/\s+/).filter(Boolean).length;

      return {
        title: baseTitle,
        content: text,
        wordCount,
        method: 'DOCX_LOCAL',
        sourceReference: `Word: ${file.name}`
      };
    } catch (err: any) {
      throw new Error(`Error al leer archivo Word: ${err.message || 'formato incompatible'}`);
    }
  }

  /**
   * Extrae texto de un archivo PDF usando PDF.js con fallback a Gemini 3.5 Flash para escaneos
   */
  private static async extractPdf(file: File, baseTitle: string): Promise<ExtractedDocument> {
    const arrayBuffer = await file.arrayBuffer();

    let localText = '';
    let pageCount = 0;

    try {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      pageCount = pdfDoc.numPages;

      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageItems = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .filter(Boolean);

        const pageStr = pageItems.join(' ').trim();
        if (pageStr) {
          pageTexts.push(`--- Página ${pageNum} ---\n${pageStr}`);
        }
      }

      localText = pageTexts.join('\n\n').trim();
    } catch (e: any) {
      console.warn('PDF.js no pudo extraer texto directo del PDF:', e);
    }

    // Si encontramos texto suficiente (> 20 palabras), retornamos la extracción local directa
    const wordCount = localText.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 20) {
      return {
        title: baseTitle,
        content: localText,
        pageCount,
        wordCount,
        method: 'PDF_LOCAL',
        sourceReference: `PDF: ${file.name} (${pageCount} pág.)`
      };
    }

    // Si el texto extraído es nulo o mínimo, puede ser un PDF escaneado (imágenes)
    // Intentamos Gemini 3.5 Flash Multimodal OCR si hay API Key disponible
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const geminiOcrText = await this.extractPdfWithGeminiOcr(arrayBuffer, apiKey);
        if (geminiOcrText && geminiOcrText.trim().length > 30) {
          const ocrWords = geminiOcrText.split(/\s+/).filter(Boolean).length;
          return {
            title: baseTitle,
            content: geminiOcrText.trim(),
            pageCount: pageCount || 1,
            wordCount: ocrWords,
            method: 'PDF_GEMINI_OCR',
            sourceReference: `PDF (OCR Gemini): ${file.name}`
          };
        }
      } catch (ocrErr) {
        console.warn('Fallback Gemini OCR falló:', ocrErr);
      }
    }

    // Si tiene algo de texto local aunque sea breve, lo devolvemos
    if (localText) {
      return {
        title: baseTitle,
        content: localText,
        pageCount: pageCount || 1,
        wordCount,
        method: 'PDF_LOCAL',
        sourceReference: `PDF: ${file.name}`
      };
    }

    throw new Error(
      'No se pudo extraer texto del PDF. Es posible que sea una imagen escaneada o requiera configurar la clave de Gemini para OCR.'
    );
  }

  /**
   * Fallback: Extrae y transcribe un PDF escaneado utilizando Gemini 3.5 Flash Multimodal
   */
  private static async extractPdfWithGeminiOcr(
    arrayBuffer: ArrayBuffer,
    apiKey: string
  ): Promise<string> {
    const base64 = this.arrayBufferToBase64(arrayBuffer);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const prompt =
      'Eres un transcriptor documental para ProcesStudio BPMN. ' +
      'Extrae y transcribe todo el contenido textual, tablas, pasos y normativas de este documento PDF. ' +
      'Mantén la estructura en texto claro y legible, sin omitir reglas de negocio ni directivas operativas.';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini OCR retornó status ${response.status}`);
    }

    const json = await response.json();
    const candidate = json.candidates?.[0];
    const textPart = candidate?.content?.parts?.find((p: any) => typeof p.text === 'string');
    return textPart?.text || '';
  }

  /**
   * Extrae texto plano (.txt, .md, .json)
   */
  private static async extractPlainText(file: File, baseTitle: string): Promise<ExtractedDocument> {
    const text = await file.text();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      title: baseTitle,
      content: text,
      wordCount,
      method: 'TEXT_PLAIN',
      sourceReference: `Archivo: ${file.name}`
    };
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
