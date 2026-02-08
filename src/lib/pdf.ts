// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json");

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1); // 1 = text only

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfParser.on("pdfParser_dataError", (errData: any) =>
      reject(new Error(errData.parserError)),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      // Extract text from the parsed data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = pdfParser.getRawTextContent().replace(/\r\n/g, "\n");
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}
