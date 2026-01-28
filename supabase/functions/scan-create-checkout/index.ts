import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// NeoHairScan Subscription Plans
const PLANS = {
  starter: {
    price_id: "price_1SuRj8LGDtsIm28fdFboHru9",
    product_id: "prod_TsC7oLHfliXYN0",
  },
  professional: {
    price_id: "price_1SuRj8LGDtsIm28fNMoMWPvr",
    product_id: "prod_TsC70h1nVWOx9c",
  },
  unlimited: {
    price_id: "price_1SuRjALGDtsIm28frGVTtO84",
    product_id: "prod_TsC77ytwZjBBaG",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { planId } = await req.json();
    
    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      throw new Error("Invalid plan selected");
    }

    const plan = PLANS[planId as keyof typeof PLANS];

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://transplant-insight-hub.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: plan.price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/neohairscan?checkout=success`,
      cancel_url: `${origin}/neohairscan?checkout=canceled`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    });

    console.log(`Checkout session created for ${user.email}, plan: ${planId}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error creating checkout:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
