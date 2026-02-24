import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('LEAD_WEBHOOK_SECRET') || 'kaizen-webhook-secret';

Deno.serve(async (req: Request) => {
    // CORS pre-flight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // Validate secret header
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    const { name, phone, origin, ai_summary, ai_metadata, directorate_id } = body;

    if (!name || !phone) {
        return new Response(JSON.stringify({ error: 'name and phone are required' }), { status: 422 });
    }

    // Service-role client to bypass RLS
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } }
    );

    try {
        // ── Fila Indiana: próximo corretor ──────────────────────────────────────────
        const { data: corretores } = await supabase
            .from('profiles')
            .select('id, last_lead_assigned_at')
            .eq('role', 'Corretor')
            .order('last_lead_assigned_at', { ascending: true, nullsFirst: true });

        let assigned_to: string | null = null;
        let distribution_status = 'aguardando_fila';

        if (corretores && corretores.length > 0) {
            const nextCorretor = corretores[0];
            assigned_to = nextCorretor.id;
            distribution_status = 'distribuido';

            await supabase
                .from('profiles')
                .update({ last_lead_assigned_at: new Date().toISOString() })
                .eq('id', nextCorretor.id);
        }

        // ── Inserir Lead ────────────────────────────────────────────────────────────
        const { data: newLead, error } = await supabase
            .from('leads')
            .insert([{
                name,
                phone,
                origin: origin || 'whatsapp',
                ai_summary: ai_summary || null,
                ai_metadata: ai_metadata || null,
                directorate_id: directorate_id || null,
                stage: 'novo_lead',
                assigned_to,
                distribution_status,
                interest_level: ai_metadata?.priority === 'alta' ? 'Alto'
                    : ai_metadata?.priority === 'media' ? 'Médio' : 'Baixo',
            }])
            .select()
            .single();

        if (error) throw error;

        return new Response(
            JSON.stringify({ success: true, lead_id: newLead.id, assigned_to, distribution_status }),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
    } catch (e: any) {
        console.error('Error inserting lead:', e);
        return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500 });
    }
});
