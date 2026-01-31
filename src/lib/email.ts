// Simple email utility (you can use services like SendGrid, Resend, etc.)
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Example with Resend (https://resend.com)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'BootHop <noreply@boothop.com>',
        to,
        subject,
        html,
      }),
    });

    return response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Email templates
export const emailTemplates = {
  newMatch: (recipientName: string, itemName: string, matchId: string) => ({
    subject: '🎉 New Match on BootHop!',
    html: `
      <h1>Great news, ${recipientName}!</h1>
      <p>You have a new match for "${itemName}".</p>
      <p>Please review the details and proceed with payment to confirm.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
        View Match Details
      </a>
    `,
  }),

  paymentReceived: (recipientName: string, amount: number) => ({
    subject: '✅ Payment Received - BootHop',
    html: `
      <h1>Payment Confirmed, ${recipientName}!</h1>
      <p>We've received your payment of £${amount.toFixed(2)}.</p>
      <p>The funds are now held securely in escrow and will be released when both parties confirm delivery completion.</p>
    `,
  }),

  deliveryConfirmed: (recipientName: string, otherParty: string) => ({
    subject: '🚚 Delivery Confirmation Required - BootHop',
    html: `
      <h1>Action Required, ${recipientName}!</h1>
      <p>${otherParty} has confirmed their part of the delivery.</p>
      <p>Please confirm your part to release the payment.</p>
      <p><strong>Both parties must confirm before payment is released.</strong></p>
    `,
  }),

  paymentReleased: (booterName: string, amount: number) => ({
    subject: '💰 Payment Released - BootHop',
    html: `
      <h1>Payment Released, ${booterName}!</h1>
      <p>Great news! Both parties have confirmed delivery completion.</p>
      <p>£${amount.toFixed(2)} has been transferred to your account.</p>
      <p>Thank you for being part of the BootHop community!</p>
    `,
  }),

  newMessage: (recipientName: string, senderName: string, matchId: string) => ({
    subject: `💬 New message from ${senderName} - BootHop`,
    html: `
      <h1>New Message, ${recipientName}!</h1>
      <p>You have a new message from ${senderName}.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages/${matchId}" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
        View Message
      </a>
    `,
  }),

  newReview: (recipientName: string, rating: number) => ({
    subject: '⭐ You received a new review - BootHop',
    html: `
      <h1>New Review, ${recipientName}!</h1>
      <p>You've received a ${rating}-star review.</p>
      <p>Keep up the great work building trust in our community!</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
        View Your Profile
      </a>
    `,
  }),
};
