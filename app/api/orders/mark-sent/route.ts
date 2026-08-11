import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const supabaseServer = getSupabaseServer();
    const { error } = await supabaseServer.from('orders').update({ whatsapp_sent: true }).eq('id', orderId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
