import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Lidar com CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Parse do Corpo da Requisição
    const requestData = await req.json()
    const { token, email, description, vendorCode } = requestData

    console.log(`[NEXUS-PAY] A receber pedido para: ${email}`)

    if (!token) throw new Error("Token de pagamento não fornecido.")
    if (!email) throw new Error("E-mail do cliente não fornecido.")

    // 3. Variáveis de Ambiente e Limpeza
    // O replace remove espaços ou quebras de linha acidentais que invalidam a chave SK
    const stripeKey = (globalThis as any).Deno.env.get('STRIPE_SECRET_KEY')?.replace(/\s/g, '')
    const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL')?.trim()
    const supabaseKey = (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()

    if (!stripeKey) throw new Error("Configuração ausente: STRIPE_SECRET_KEY não encontrada no servidor.")
    if (!supabaseUrl || !supabaseKey) throw new Error("Configuração ausente: Credenciais Supabase não encontradas.")

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    // 4. Cálculo do Valor Final
    const BASE_PRICE = 14.99
    let finalPrice = BASE_PRICE
    let discountApplied = false

    if (vendorCode) {
      const code = vendorCode.trim().toUpperCase()
      const { data: vData } = await supabaseAdmin.from('vendors').select('code').ilike('code', code).maybeSingle()
      const { data: pData } = await supabaseAdmin.from('profiles').select('vendor_code').ilike('vendor_code', code).maybeSingle()
      
      if (vData || pData) {
        discountApplied = true
        finalPrice = BASE_PRICE * 0.95 
      }
    }

    // O Stripe exige o montante em cêntimos (inteiro positivo)
    const amountCents = Math.round(finalPrice * 100)
    
    if (isNaN(amountCents) || amountCents <= 0) {
      throw new Error(`Montante calculado inválido: ${amountCents}`)
    }

    // 5. Construção dos Parâmetros via URLSearchParams
    // Esta é a forma mais robusta no Deno para enviar form-urlencoded.
    // O fetch tratará de converter o objeto para string e definir o Content-Type correto.
    const params = new URLSearchParams()
    params.append('amount', amountCents.toString())
    params.append('currency', 'eur')
    params.append('confirm', 'true')
    params.append('payment_method_data[type]', 'card')
    params.append('payment_method_data[card][token]', token)
    params.append('description', description || `Licença NexusTime Elite - ${email}`)
    params.append('receipt_email', email)
    params.append('off_session', 'true')
    params.append('return_url', 'https://digitalnexus.solutions/success')
    
    // Metadados para auditoria no Stripe Dashboard
    params.append('metadata[vendor_code]', vendorCode || 'DIRETO')
    params.append('metadata[discount_applied]', discountApplied ? '5%' : '0%')

    console.log(`[NEXUS-PAY] Montante: ${amountCents} cêntimos. A contactar Stripe...`)

    // 6. Execução da Chamada à API do Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        // Não definir Content-Type manualmente aqui, o fetch faz isso automaticamente com URLSearchParams
      },
      body: params
    })

    const stripeData = await stripeResponse.json()

    if (!stripeResponse.ok) {
      console.error("[NEXUS-STRIPE-ERROR]:", JSON.stringify(stripeData))
      const errorMessage = stripeData.error?.message || "Erro desconhecido no processamento bancário."
      throw new Error(errorMessage)
    }

    console.log(`[NEXUS-PAY] Sucesso! Intent ID: ${stripeData.id}`)

    // 7. Resposta de Sucesso ao Frontend
    return new Response(
      JSON.stringify({ 
        success: true, 
        chargeId: stripeData.id, 
        amountCharged: amountCents / 100,
        discounted: discountApplied,
        status: stripeData.status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error: any) {
    console.error("[NEXUS-FATAL-ERROR]:", error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: "A Digital Nexus Solutions não conseguiu processar o pagamento."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})