import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[NEOACADEMY-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("NEOACADEMY_STRIPE_WEBHOOK_SECRET");
    
    let event: Stripe.Event;
    
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback: parse body directly (dev mode)
      event = JSON.parse(body) as Stripe.Event;
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, mode: session.mode });
        
        const userId = session.metadata?.user_id;
        if (!userId) { logStep("No user_id in metadata"); break; }

        // Find account for user
        const { data: member } = await supabaseAdmin
          .from('neoacademy_account_members')
          .select('account_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        
        let accountId = member?.account_id;
        if (!accountId) {
          const { data: acc } = await supabaseAdmin
            .from('neoacademy_accounts')
            .select('id')
            .limit(1)
            .maybeSingle();
          accountId = acc?.id;
        }
        if (!accountId) { logStep("No account found"); break; }

        // Create order
        const orderData: any = {
          account_id: accountId,
          user_id: userId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
          order_type: session.mode === 'subscription' ? 'subscription' : 'one_time',
          status: 'paid',
          amount_cents: session.amount_total || 0,
          currency: session.currency || 'brl',
          description: session.metadata?.description || 'Pagamento NeoAcademy',
          paid_at: new Date().toISOString(),
          metadata: session.metadata || {},
        };

        const { error: orderError } = await supabaseAdmin
          .from('neoacademy_orders')
          .insert(orderData);
        
        if (orderError) logStep("Order insert error", orderError);
        else logStep("Order created successfully");

        // Auto-enroll if course_ids in metadata
        const courseIds = session.metadata?.course_ids;
        if (courseIds) {
          const ids = courseIds.split(',').filter(Boolean);
          for (const courseId of ids) {
            const { error: enrollError } = await supabaseAdmin
              .from('neoacademy_enrollments')
              .upsert({
                user_id: userId,
                course_id: courseId.trim(),
                account_id: accountId,
                is_active: true,
              }, { onConflict: 'user_id,course_id' });
            if (enrollError) logStep("Enrollment error", enrollError);
            else logStep("Enrolled user in course", { courseId });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
        if (customerId) {
          // Mark related orders as overdue
          await supabaseAdmin
            .from('neoacademy_orders')
            .update({ status: 'overdue', updated_at: new Date().toISOString() })
            .eq('stripe_customer_id', customerId)
            .eq('status', 'paid')
            .eq('order_type', 'subscription');
          
          logStep("Orders marked as overdue for customer", { customerId });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription canceled", { subscriptionId: subscription.id });
        
        await supabaseAdmin
          .from('neoacademy_orders')
          .update({ status: 'canceled', canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);

        logStep("Orders canceled for subscription", { subscriptionId: subscription.id });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id });
        
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
        if (customerId) {
          // Reactivate overdue orders
          await supabaseAdmin
            .from('neoacademy_orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('stripe_customer_id', customerId)
            .eq('status', 'overdue');
          
          logStep("Overdue orders reactivated for customer", { customerId });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
