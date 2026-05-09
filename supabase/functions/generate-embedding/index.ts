// Use Supabase's built-in AI session (runs gte-small natively on Edge Runtime)
const session = new Supabase.ai.Session('gte-small');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Generating embedding for text: ${text.substring(0, 50)}...`);

    // Generate the embedding from the user input using the built-in session
    // 'gte-small' outputs a 384-dimensional vector
    const embedding = await session.run(text, {
      mean_pool: true,
      normalize: true,
    });

    return new Response(
      JSON.stringify({ embedding }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})