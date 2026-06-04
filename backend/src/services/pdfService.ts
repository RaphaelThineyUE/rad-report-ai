import pdf from 'pdf-parse';

export const extractPdfText = async (buffer: Buffer) => {
  const result = await pdf(buffer);
  return result.text;
};
