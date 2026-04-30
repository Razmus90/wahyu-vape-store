import { supabase, supabaseAdmin, Log } from '@/lib/supabase';

export const logService = {
  async create(
    level: Log['level'],
    action: string,
    message: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await supabaseAdmin.from('logs').insert({ level, action, message, metadata });
  },

  async getAll(limit = 100): Promise<Log[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getByLevel(level: Log['level'], limit = 50): Promise<Log[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('level', level)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
