// Cloudflare Pages Function - Check Payment Status
// Optional: Query payment status from your storage

interface Env {
  // Optional: Add KV namespace for order storage
  // ORDERS: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const url = new URL(context.request.url);
    const orderId = url.searchParams.get('order_id');

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // TODO: Implement actual order lookup from your database/KV
    // Example with KV:
    // const orderData = await context.env.ORDERS?.get(orderId);
    // if (orderData) {
    //   return new Response(orderData, { status: 200, headers: corsHeaders });
    // }

    // For now, return a placeholder response
    return new Response(
      JSON.stringify({ 
        order_id: orderId,
        status: 'unknown',
        message: 'Order status tracking not yet implemented. Check PayHere dashboard.'
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check payment status' }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
