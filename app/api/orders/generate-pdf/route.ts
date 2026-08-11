import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, catalog } = body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });

    // create pdf
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 60;
    page.drawText(catalog.name || 'Pedido desde catálogo', { x: 40, y, size: 18, font });
    y -= 26;
    page.drawText(`Fecha: ${new Date().toLocaleString()}`, { x: 40, y, size: 10, font: fontNormal });
    y -= 18;

    let total = 0;

    for (const item of cart) {
      if (y < 140) { page = pdfDoc.addPage([595, 842]); y = 800; }

      try {
        if (item.image_url) {
          const resp = await fetch(item.image_url);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            const contentType = resp.headers.get('content-type') || '';
            let img: any = null;
            if (contentType.includes('png')) img = await pdfDoc.embedPng(buf);
            else img = await pdfDoc.embedJpg(buf).catch(()=>null);
            if (img) {
              const scale = Math.min(80 / img.width, 80 / img.height);
              const imgW = img.width * scale;
              const imgH = img.height * scale;
              page.drawImage(img, { x: 40, y: y - imgH + 10, width: imgW, height: imgH });
            }
          }
        }
      } catch (e) { }

      const xText = 140;
      const line1 = `${item.name} x${item.qty || 1}`;
      page.drawText(line1, { x: xText, y: y - 10, size: 12, font: fontNormal });
      const price = Number(item.price || 0) * Number(item.qty || 1);
      page.drawText(`S/ ${price.toFixed(2)}`, { x: 440, y: y - 10, size: 12, font: fontNormal });
      y -= 90;
      total += price;
    }

    page.drawText(`Total: S/ ${total.toFixed(2)}`, { x: 40, y: y - 10, size: 14, font });

    // payment info from catalog (optional)
    if (catalog.payment_info) {
      let y2 = y - 40;
      if (y2 < 120) { page = pdfDoc.addPage([595,842]); y2 = 800; }
      page.drawText('Instrucciones de pago:', { x: 40, y: y2, size: 12, font: fontNormal });
      y2 -= 16;
      const lines = String(catalog.payment_info).split(/\r?\n/).slice(0,10);
      for (const ln of lines) {
        page.drawText(ln, { x: 40, y: y2, size: 11, font: fontNormal });
        y2 -= 14;
      }
    }

    const pdfBytes = await pdfDoc.save();

    const id = uuidv4();
    const filename = `orders/${catalog.slug || 'catalog'}-${id}.pdf`;
    const bucket = process.env.SUPABASE_ORDERS_BUCKET || 'orders';

    const supabaseServer = getSupabaseServer();

    const { data: uploadData, error: uploadError } = await supabaseServer.storage.from(bucket).upload(filename, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: true });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: publicUrlData } = supabaseServer.storage.from(bucket).getPublicUrl(filename);
    const publicUrl = publicUrlData.publicUrl;

    // insert order record
    const orderRow = {
      id,
      catalog_id: catalog.id || null,
      catalog_slug: catalog.slug || null,
      items: cart,
      total: total,
      pdf_url: publicUrl,
      whatsapp_sent: false
    };

    const { error: insertError } = await supabaseServer.from('orders').insert(orderRow as any);
    if (insertError) {
      // continue but warn
      console.warn('Could not insert order row:', insertError.message);
    }

    return NextResponse.json({ url: publicUrl, orderId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
