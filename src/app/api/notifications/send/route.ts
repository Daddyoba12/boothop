import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase.admin';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { type, recipientId, data } = await req.json();

    // Get recipient profile
    const { data: recipient, error } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, email_notifications')
      .eq('id', recipientId)
      .single();

    if (error || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Check if user has email notifications enabled
    if (!recipient.email_notifications) {
      return NextResponse.json({ message: 'Notifications disabled for user' });
    }

    // Generate email based on type
    let emailContent;
    switch (type) {
      case 'new_match':
        emailContent = emailTemplates.newMatch(recipient.full_name, data.itemName, data.matchId);
        break;
      case 'payment_received':
        emailContent = emailTemplates.paymentReceived(recipient.full_name, data.amount);
        break;
      case 'delivery_confirmed':
        emailContent = emailTemplates.deliveryConfirmed(recipient.full_name, data.otherParty);
        break;
      case 'payment_released':
        emailContent = emailTemplates.paymentReleased(recipient.full_name, data.amount);
        break;
      case 'new_message':
        emailContent = emailTemplates.newMessage(recipient.full_name, data.senderName, data.matchId);
        break;
      case 'new_review':
        emailContent = emailTemplates.newReview(recipient.full_name, data.rating);
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Send email
    await sendEmail({
      to: recipient.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
