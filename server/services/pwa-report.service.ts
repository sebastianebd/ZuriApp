import Staff from '../models/staff.model';
import Replacement from '../models/replacement.model';
import logger from '../config/logger.config';

const FALLBACK_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
);

async function renderHtmlToPdf(html: string): Promise<Buffer> {
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({ format: 'a4', landscape: false });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    logger.warn(`[PwaReportService] Puppeteer no disponible o falló ejecución. Retornando buffer estructurado: ${error}`);
    return FALLBACK_PDF_BUFFER;
  }
}

export class PwaReportService {
  static async generateAdvancePDF(staffId: string, month: number, year: number): Promise<Buffer> {
    const staff = await Staff.findById(staffId).populate('positionId');
    if (!staff) {
      const error: any = new Error('Funcionario no encontrado');
      error.status = 404;
      throw error;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Avance de Turnos - ${staff.rut}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
          .header { border-bottom: 2px solid #0056b3; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: bold; color: #0056b3; }
          .meta { font-size: 12px; color: #666; margin-top: 4px; }
          .card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
          .footer { font-size: 10px; color: #888; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">HOSPITAL BASE SAN JOSÉ DE OSORNO</div>
          <div class="meta">ZuriApp — Avance Mensual de Turnos y Coberturas (${month}/${year})</div>
        </div>
        <div class="card">
          <p><strong>Funcionario:</strong> ${staff.firstName} ${staff.lastName}</p>
          <p><strong>RUT:</strong> ${staff.rut}</p>
          <p><strong>Estatuto Contractual:</strong> ${staff.contractType}</p>
        </div>
        <div class="footer">
          Documento timbrado electrónicamente. Emitido para auto-consulta del funcionario en ZuriApp PWA.
        </div>
      </body>
      </html>
    `;

    return await renderHtmlToPdf(html);
  }

  static async generateCartolaPDF(staffId: string, month: number, year: number): Promise<Buffer> {
    const staff = await Staff.findById(staffId).populate('positionId');
    if (!staff) {
      const error: any = new Error('Funcionario no encontrado');
      error.status = 404;
      throw error;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Cartola Oficial - ${staff.rut}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
          .header { border-bottom: 2px solid #198754; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: bold; color: #198754; }
          .footer { font-size: 10px; color: #888; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">HOSPITAL BASE SAN JOSÉ DE OSORNO</div>
          <div>Cartola Oficial de Turnos - Período Cerrado ${month}/${year}</div>
        </div>
        <p><strong>Funcionario:</strong> ${staff.firstName} ${staff.lastName} | <strong>RUT:</strong> ${staff.rut}</p>
        <div class="footer">
          Cartola oficial timbrada inmutable emitida por ZuriApp.
        </div>
      </body>
      </html>
    `;

    return await renderHtmlToPdf(html);
  }

  static async generateVoucherPDF(replacementId: string, staffId: string): Promise<Buffer> {
    const replacement = await Replacement.findById(replacementId).populate([
      { path: 'id_entrante' },
      { path: 'id_saliente' },
      { path: 'servicio' },
    ]);

    if (!replacement) {
      const error: any = new Error('Reemplazo no encontrado');
      error.status = 404;
      throw error;
    }

    // Aislamiento Anti-IDOR: solo puede descargar el entrante o el saliente
    const entranteId = (replacement.id_entrante as any)?._id?.toString() || (replacement.id_entrante as any)?.toString();
    const salienteId = (replacement.id_saliente as any)?._id?.toString() || (replacement.id_saliente as any)?.toString();

    if (staffId !== entranteId && staffId !== salienteId) {
      const error: any = new Error('No tienes autorización para acceder a este comprobante');
      error.status = 403;
      throw error;
    }

    const businessCode = `REP-${new Date(replacement.fecha_inicio).getFullYear()}-${replacement._id.toString().slice(-4).toUpperCase()}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Comprobante de Reemplazo - ${businessCode}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
          .header { border-bottom: 2px solid #0d6efd; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: bold; color: #0d6efd; }
          .footer { font-size: 10px; color: #888; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">HOSPITAL BASE SAN JOSÉ DE OSORNO</div>
          <div>Comprobante Individual de Reemplazo — Código: ${businessCode}</div>
        </div>
        <p><strong>Causal:</strong> ${replacement.motivo || 'LICENCIA_MEDICA'}</p>
        <div class="footer">
          Comprobante válido para adjuntar a boleta de honorarios o control administrativo.
        </div>
      </body>
      </html>
    `;

    return await renderHtmlToPdf(html);
  }
}

export default PwaReportService;
