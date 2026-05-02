import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products_cache')
      .select('klasifikasi')
      .not('klasifikasi', 'is', null);

    if (error) throw error;

    const values = [...new Set((data || []).map(r => r.klasifikasi).filter(Boolean))].sort();
    return NextResponse.json({ success: true, data: values });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
