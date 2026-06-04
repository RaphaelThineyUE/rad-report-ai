declare module 'pdf-parse' {
  export interface PdfParseResult {
    text: string;
  }

  export default function pdf(dataBuffer: Buffer): Promise<PdfParseResult>;
}
