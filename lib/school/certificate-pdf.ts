import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

import { SCHOOL as DEFAULT_SCHOOL, SITE_URL } from "./config";
import { formatLongDate } from "./format";

/**
 * Printable A4 certificate with a QR code that opens the public verification
 * page. Built with pdf-lib so it renders the same everywhere and needs no
 * browser.
 */

export interface CertificateContent {
  certificateNo: string;
  award: string;
  category?: string;
  citation?: string;
  sessionName: string;
  issuedAt: string;
  studentName: string;
  classLabel: string;
}

const NAVY = rgb(0.067, 0.133, 0.29);
const GOLD = rgb(0.78, 0.6, 0.22);
const INK = rgb(0.15, 0.17, 0.22);
const MUTED = rgb(0.42, 0.45, 0.5);

export const verifyUrl = (certificateNo: string) => `${SITE_URL}/verify?no=${encodeURIComponent(certificateNo)}`;

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - width) / 2, y, size, font, color });
}

/** Shrink a line until it fits the width. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number) {
  let s = size;
  while (s > 10 && font.widthOfTextAtSize(text, s) > maxWidth) s -= 1;
  return s;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** pdf-lib's standard fonts only cover WinAnsi; replace anything else. */
const safe = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/→/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");

function drawQr(page: PDFPage, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const cell = size / n;
  page.drawRectangle({ x: x - 4, y: y - 4, width: size + 8, height: size + 8, color: rgb(1, 1, 1) });
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (qr.modules.get(row, col)) {
        page.drawRectangle({ x: x + col * cell, y: y + size - (row + 1) * cell, width: cell + 0.2, height: cell + 0.2, color: NAVY });
      }
    }
  }
}

/** The parts of the school's identity a certificate prints. */
export type CertificateSchool = { name: string; motto: string; city: string; headteacher: string };

export async function renderCertificatePdf(c: CertificateContent, school: CertificateSchool = DEFAULT_SCHOOL): Promise<Uint8Array> {
  const SCHOOL = { ...school, country: DEFAULT_SCHOOL.country };
  const doc = await PDFDocument.create();
  doc.setTitle(`${SCHOOL.name} certificate ${c.certificateNo}`);
  doc.setAuthor(SCHOOL.name);
  doc.setSubject(c.award);
  const page = doc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();
  const [serif, serifBold, serifItalic, sans, sansBold] = await Promise.all([
    doc.embedFont(StandardFonts.TimesRoman),
    doc.embedFont(StandardFonts.TimesRomanBold),
    doc.embedFont(StandardFonts.TimesRomanItalic),
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
  ]);

  // Frame
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 0.992, 0.965) });
  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: NAVY, borderWidth: 6 });
  page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: GOLD, borderWidth: 1.5 });

  // Heading
  centered(page, safe(SCHOOL.name).toUpperCase(), height - 88, sansBold, 20, NAVY);
  centered(page, safe(`${SCHOOL.motto}  ·  ${SCHOOL.city}, ${SCHOOL.country}`), height - 108, serifItalic, 12, MUTED);
  page.drawLine({ start: { x: width / 2 - 70, y: height - 122 }, end: { x: width / 2 + 70, y: height - 122 }, thickness: 1.2, color: GOLD });

  const heading = c.category ? `Certificate of ${c.category}` : "Certificate of Achievement";
  centered(page, safe(heading), height - 168, serifBold, fit(safe(heading), serifBold, 36, width - 160), NAVY);
  centered(page, "This certificate is proudly presented to", height - 206, serifItalic, 15, MUTED);

  const name = safe(c.studentName);
  centered(page, name, height - 256, serifBold, fit(name, serifBold, 40, width - 200), INK);
  page.drawLine({ start: { x: width / 2 - 200, y: height - 268 }, end: { x: width / 2 + 200, y: height - 268 }, thickness: 0.8, color: GOLD });
  if (c.classLabel) centered(page, safe(c.classLabel), height - 288, sans, 12, MUTED);

  centered(page, safe(c.award), height - 322, sansBold, fit(safe(c.award), sansBold, 18, width - 200), NAVY);
  let y = height - 346;
  if (c.citation) {
    for (const line of wrap(safe(c.citation), serifItalic, 13, width - 260).slice(0, 3)) {
      centered(page, line, y, serifItalic, 13, INK);
      y -= 17;
    }
  }
  centered(page, safe(`Academic session ${c.sessionName}`), y - 6, sans, 11, MUTED);

  // Signature and date
  const baseY = 118;
  page.drawLine({ start: { x: 300, y: baseY }, end: { x: 480, y: baseY }, thickness: 0.8, color: INK });
  page.drawText(safe(SCHOOL.headteacher), { x: 300, y: baseY - 16, size: 11, font: sansBold, color: INK });
  page.drawText("Headteacher", { x: 300, y: baseY - 30, size: 10, font: sans, color: MUTED });

  page.drawLine({ start: { x: 540, y: baseY }, end: { x: 720, y: baseY }, thickness: 0.8, color: INK });
  page.drawText(safe(formatLongDate(c.issuedAt)), { x: 540, y: baseY + 6, size: 12, font: serif, color: INK });
  page.drawText("Date of award", { x: 540, y: baseY - 16, size: 10, font: sans, color: MUTED });

  // Verification
  const qrSize = 86;
  drawQr(page, verifyUrl(c.certificateNo), 70, 70, qrSize);
  page.drawText("Scan to verify", { x: 70, y: 56, size: 8, font: sansBold, color: NAVY });
  page.drawText(`Certificate No. ${c.certificateNo}`, { x: 170, y: 82, size: 9, font: sansBold, color: INK });
  page.drawText(safe(`${SITE_URL.replace(/^https?:\/\//, "")}/verify`), { x: 170, y: 70, size: 8, font: sans, color: MUTED });

  return await doc.save();
}
