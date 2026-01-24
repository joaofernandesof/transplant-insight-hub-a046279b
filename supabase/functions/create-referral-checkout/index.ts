import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-REFERRAL-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { name, email, phone, referralCode, hasCrm, crm } = await req.json();
    
    if (!name || !email || !phone) {
      throw new Error("Missing required fields: name, email, phone");
    }
    logStep("Request data validated", { name, email, referralCode });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        phone,
        metadata: {
          referral_code: referralCode || 'DIRECT',
          has_crm: hasCrm ? 'true' : 'false',
          crm: crm || '',
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Price ID for R$ 1.000 deposit
    const DEPOSIT_PRICE_ID = "price_1StG97LGDtsIm28fgsYSXw1Y";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: DEPOSIT_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/indicacao-formacao360/${referralCode || 'success'}?payment=success`,
      cancel_url: `${req.headers.get("origin")}/indicacao-formacao360/${referralCode || 'cancelled'}?payment=cancelled`,
      metadata: {
        referral_code: referralCode || 'DIRECT',
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        has_crm: hasCrm ? 'true' : 'false',
        crm: crm || '',
        product_type: 'formacao360_deposit',
      },
      payment_intent_data: {
        metadata: {
          referral_code: referralCode || 'DIRECT',
          product_type: 'formacao360_deposit',
        }
      },
      locale: 'pt-BR',
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
