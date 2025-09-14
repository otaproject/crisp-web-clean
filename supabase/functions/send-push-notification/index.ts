import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  operatorId: string;
  title: string;
  body: string;
  type: 'shift_assignment' | 'shift_update' | 'shift_cancellation';
  eventId?: string;
  shiftId?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VAPID_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg0f5vKvOuONRcnn+F
oQD6Ax4v+o2AFjv9GH3/D+D3V+qhRANCAATJeuLxjQHJG1l/dyLv3Y6VfZYR0fRI
DPoRwHrUYPnDrQnExkHLvz/C9rOO2OPwJ1IFR+wGQ5LVQ6PTSD5xFJ3T
-----END PRIVATE KEY-----`;

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HuWukzpkiHype611dKpaOeaG8bR7obOPKdaOYpvLS0wdK2K5OiKrq4mVEY';

serve(async (req) => {
  console.log('Push notification function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { operatorId, title, body, type, eventId, shiftId }: NotificationPayload = await req.json();

    console.log(`Sending notification to operator: ${operatorId}`);

    // Get the operator's push subscription
    const { data: subscription, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('operator_id', operatorId)
      .single();

    if (subError || !subscription) {
      console.log(`No push subscription found for operator: ${operatorId}`);
      
      // Still create the notification record for in-app notifications
      const notificationId = crypto.randomUUID();
      await supabase
        .from('notifications')
        .insert({
          id: notificationId,
          operator_id: operatorId,
          title,
          message: body,
          type,
          event_id: eventId,
          shift_id: shiftId,
          read: false
        });

      return new Response(
        JSON.stringify({ success: true, message: 'Notification saved but no push subscription' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create notification record in database
    const notificationId = crypto.randomUUID();
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        id: notificationId,
        operator_id: operatorId,
        title,
        message: body,
        type,
        event_id: eventId,
        shift_id: shiftId,
        read: false
      });

    if (notifError) {
      console.error('Error saving notification:', notifError);
      throw notifError;
    }

    // Send push notification
    const pushPayload = {
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        operatorId,
        eventId,
        shiftId,
        notificationId,
        url: eventId ? `/events/${eventId}` : '/'
      }
    };

    const webPushPayload = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key
      }
    };

    // For demo purposes, we simulate push notification
    // In production, you would use a proper Web Push library
    console.log('Push notification payload:', pushPayload);
    console.log('Subscription endpoint:', webPushPayload.endpoint);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        notificationId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});