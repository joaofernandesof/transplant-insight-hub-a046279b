import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map product IDs to plan names
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_TsC7oLHfliXYN0": "starter",
  "prod_TsC70h1nVWOx9c": "professional",
  "prod_TsC77ytwZjBBaG": "unlimited",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      // No Stripe customer - return free plan
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Update user_scan_credits to free if they had a paid plan
      await supabaseClient
        .from("user_scan_credits")
        .update({ plan: "free", monthly_credits: 0 })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const productId = subscription.items.data[0].price.product as string;
    const planName = PRODUCT_TO_PLAN[productId] || "free";
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

    // Update user_scan_credits table with the new plan
    const planCredits = {
      starter: { daily: 5, monthly: 50 },
      professional: { daily: 10, monthly: 150 },
      unlimited: { daily: 999, monthly: 9999 },
    };

    const credits = planCredits[planName as keyof typeof planCredits] || { daily: 3, monthly: 0 };

    await supabaseClient
      .from("user_scan_credits")
      .upsert({
        user_id: user.id,
        plan: planName,
        daily_credits: credits.daily,
        monthly_credits: credits.monthly,
        plan_started_at: new Date(subscription.start_date * 1000).toISOString(),
        plan_expires_at: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    console.log(`Subscription check for ${user.email}: ${planName}, ends ${subscriptionEnd}`);

    return new Response(JSON.stringify({
      subscribed: true,
      plan: planName,
      product_id: productId,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    console.error("Error checking subscription:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
