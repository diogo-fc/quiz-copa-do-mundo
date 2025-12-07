// Supabase Edge Function para atualizar rankings
// Deploy: supabase functions deploy update-rankings
// Trigger: Configure um cron job no Supabase ou use um serviço externo

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client with service role key
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Call the update_rankings function
        const { error } = await supabase.rpc('update_rankings')

        if (error) {
            console.error('Error updating rankings:', error)
            return new Response(
                JSON.stringify({ success: false, error: error.message }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Get updated rankings count
        const { count: weeklyCount } = await supabase
            .from('rankings')
            .select('*', { count: 'exact', head: true })
            .eq('period', 'weekly')

        const { count: monthlyCount } = await supabase
            .from('rankings')
            .select('*', { count: 'exact', head: true })
            .eq('period', 'monthly')

        const { count: alltimeCount } = await supabase
            .from('rankings')
            .select('*', { count: 'exact', head: true })
            .eq('period', 'alltime')

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Rankings updated successfully',
                counts: {
                    weekly: weeklyCount,
                    monthly: monthlyCount,
                    alltime: alltimeCount
                },
                updatedAt: new Date().toISOString()
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (err) {
        console.error('Unexpected error:', err)
        return new Response(
            JSON.stringify({ success: false, error: 'Internal server error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

/* 
============================================
INSTRUÇÕES DE DEPLOY
============================================

1. Instale o Supabase CLI:
   npm install -g supabase

2. Faça login:
   supabase login

3. Linke seu projeto:
   supabase link --project-ref solfbmzjhabcjlhadkcw

4. Deploy a função:
   supabase functions deploy update-rankings

5. Configure o cron no Supabase Dashboard:
   - Vá para Database > Extensions
   - Ative pg_cron
   - Execute no SQL Editor:
     SELECT cron.schedule(
       'update-rankings-hourly',
       '0 * * * *',
       'SELECT public.update_rankings()'
     );

OU use um serviço externo como:
- Vercel Cron Jobs
- GitHub Actions scheduled workflow
- Uptime Robot / Cron-job.org

Chamando a edge function:
curl -X POST https://solfbmzjhabcjlhadkcw.supabase.co/functions/v1/update-rankings \
  -H "Authorization: Bearer YOUR_ANON_KEY"
*/
