import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

type OrderItem = {
  name: string;
  price: number;
  qty: number;
  variant?: string;
};

type OrderRequest = {
  cart?: OrderItem[];
  catalog?: { name?: string; currency?: string; payment_info?: string };
  customer?: { name?: string; phone?: string; note?: string };
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 44;

function safeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();
}

function money(value: number, currency = "PEN") {
  const amount = Number.isFinite(value) ? value : 0;
  const symbol = currency === "USD" ? "$" : "S/";
  return `${symbol} ${amount.toFixed(2)}`;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawLines(page: PDFPage, lines: string[], x: number, y: number, font: PDFFont, size: number, color = rgb(0.2, 0.2, 0.22)) {
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * (size + 4), size, font, color }));
  return y - lines.length * (size + 4);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequest;
    const cart = body.cart?.slice(0, 100) ?? [];
    if (!cart.length) return Response.json({ error: "El pedido esta vacio." }, { status: 400 });

    const normalized = cart.map((item) => ({
      name: safeText(item.name).slice(0, 160),
      price: Math.max(0, Number(item.price) || 0),
      qty: Math.min(999, Math.max(1, Math.floor(Number(item.qty) || 1))),
      variant: safeText(item.variant).slice(0, 160),
    }));

    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const orderId = crypto.randomUUID().split("-")[0].toUpperCase();
    const currency = body.catalog?.currency || "PEN";
    let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    const addHeader = () => {
      page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 132, width: PAGE_WIDTH, height: 132, color: rgb(0.055, 0.055, 0.06) });
      page.drawText("PEDIDO", { x: MARGIN, y: PAGE_HEIGHT - 72, size: 28, font: bold, color: rgb(1, 1, 1) });
      page.drawText(safeText(body.catalog?.name || "Catalogo digital"), { x: MARGIN, y: PAGE_HEIGHT - 99, size: 12, font: regular, color: rgb(0.88, 0.88, 0.9) });
      page.drawText(`#${orderId}`, { x: 455, y: PAGE_HEIGHT - 72, size: 13, font: bold, color: rgb(1, 1, 1) });
      y = PAGE_HEIGHT - 162;
    };

    const drawTableHeader = () => {
      page.drawRectangle({ x: MARGIN, y: y - 24, width: PAGE_WIDTH - MARGIN * 2, height: 24, color: rgb(0.94, 0.94, 0.95) });
      page.drawText("Producto", { x: MARGIN + 8, y: y - 16, size: 9, font: bold });
      page.drawText("Cant.", { x: 365, y: y - 16, size: 9, font: bold });
      page.drawText("P. unit.", { x: 408, y: y - 16, size: 9, font: bold });
      page.drawText("Subtotal", { x: 492, y: y - 16, size: 9, font: bold });
      y -= 42;
    };

    const addPage = () => {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      page.drawText(`Pedido #${orderId}`, { x: MARGIN, y, size: 11, font: bold, color: rgb(0.35, 0.35, 0.38) });
      y -= 28;
      drawTableHeader();
    };

    addHeader();
    const date = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeStyle: "short", timeZone: "America/Lima" }).format(new Date());
    page.drawText(`Fecha: ${safeText(date)}`, { x: MARGIN, y, size: 10, font: regular, color: rgb(0.38, 0.38, 0.42) });
    y -= 25;

    if (body.customer?.name || body.customer?.phone || body.customer?.note) {
      page.drawText("DATOS DEL CLIENTE", { x: MARGIN, y, size: 10, font: bold, color: rgb(0.2, 0.2, 0.22) });
      y -= 18;
      if (body.customer.name) y = drawLines(page, wrapText(`Nombre: ${body.customer.name}`, regular, 10, 500), MARGIN, y, regular, 10);
      if (body.customer.phone) y = drawLines(page, wrapText(`Telefono: ${body.customer.phone}`, regular, 10, 500), MARGIN, y, regular, 10);
      if (body.customer.note) y = drawLines(page, wrapText(`Indicaciones: ${body.customer.note}`, regular, 10, 500), MARGIN, y, regular, 10);
      y -= 10;
    }

    drawTableHeader();

    let total = 0;
    for (const item of normalized) {
      const nameLines = wrapText(item.name, bold, 10, 295);
      const variantLines = item.variant ? wrapText(item.variant, regular, 9, 295) : [];
      const rowHeight = Math.max(38, nameLines.length * 14 + variantLines.length * 13 + 8);
      if (y - rowHeight < 90) addPage();

      drawLines(page, nameLines, MARGIN + 8, y, bold, 10, rgb(0.12, 0.12, 0.14));
      if (variantLines.length) drawLines(page, variantLines, MARGIN + 8, y - nameLines.length * 14, regular, 9, rgb(0.42, 0.42, 0.46));
      page.drawText(String(item.qty), { x: 372, y, size: 10, font: regular });
      page.drawText(money(item.price, currency), { x: 408, y, size: 10, font: regular });
      const subtotal = item.price * item.qty;
      page.drawText(money(subtotal, currency), { x: 492, y, size: 10, font: bold });
      total += subtotal;
      page.drawLine({ start: { x: MARGIN, y: y - rowHeight + 9 }, end: { x: PAGE_WIDTH - MARGIN, y: y - rowHeight + 9 }, thickness: 0.6, color: rgb(0.88, 0.88, 0.9) });
      y -= rowHeight;
    }

    if (y < 145) addPage();
    page.drawText("TOTAL", { x: 405, y: y - 8, size: 12, font: bold });
    page.drawText(money(total, currency), { x: 492, y: y - 8, size: 13, font: bold });
    y -= 42;

    if (body.catalog?.payment_info) {
      page.drawText("INSTRUCCIONES DE PAGO", { x: MARGIN, y, size: 10, font: bold });
      y -= 18;
      const paymentLines = wrapText(body.catalog.payment_info, regular, 10, PAGE_WIDTH - MARGIN * 2).slice(0, 12);
      drawLines(page, paymentLines, MARGIN, y, regular, 10);
    }

    const pages = pdf.getPages();
    pages.forEach((currentPage, index) => {
      const pageNumber = `Pagina ${index + 1} de ${pages.length}`;
      currentPage.drawLine({ start: { x: MARGIN, y: 52 }, end: { x: PAGE_WIDTH - MARGIN, y: 52 }, thickness: 0.5, color: rgb(0.88, 0.88, 0.9) });
      currentPage.drawText("Solicitud de pedido. La disponibilidad se confirma por WhatsApp.", { x: MARGIN, y: 35, size: 8, font: regular, color: rgb(0.46, 0.46, 0.5) });
      currentPage.drawText(pageNumber, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(pageNumber, 8), y: 35, size: 8, font: regular, color: rgb(0.46, 0.46, 0.5) });
    });

    const bytes = await pdf.save();
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="pedido-${orderId}.pdf"`,
        "Cache-Control": "no-store",
        "X-Order-Id": orderId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el PDF.";
    return Response.json({ error: message }, { status: 500 });
  }
}
