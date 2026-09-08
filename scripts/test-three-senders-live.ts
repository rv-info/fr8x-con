import { EmailService } from '../lib/email-service';

async function run() {
  console.log('Testing ZeptoMail with the 3 authorized senders...');

  // 1. Send from password@fr8x.in
  console.log('\n[1/3] Sending from password@fr8x.in -> tech@fr8x.in');
  const res1 = await EmailService.sendOtpEmail({
    to: 'tech@fr8x.in',
    otpCode: '839201',
    expiryMinutes: 10,
  });
  console.log('Result 1:', { success: res1.success, provider: res1.provider, msgId: res1.messageId, error: res1.error });

  // 2. Send from support@fr8x.in
  console.log('\n[2/3] Sending from support@fr8x.in -> tech@fr8x.in');
  const res2 = await EmailService.sendSupportEmail({
    recipient: 'tech@fr8x.in',
    subject: 'Support Channel Live Verification',
    message: 'Test email dispatched from verified support@fr8x.in identity.',
  });
  console.log('Result 2:', { success: res2.success, provider: res2.provider, msgId: res2.messageId, error: res2.error });

  // 3. Send from tech@fr8x.in
  console.log('\n[3/3] Sending from tech@fr8x.in -> tech@fr8x.in');
  const res3 = await EmailService.sendTechnicalEmail({
    to: 'tech@fr8x.in',
    recipient: 'tech@fr8x.in',
    subject: 'Technical Channel Live Verification',
    details: 'Test email dispatched from verified tech@fr8x.in identity.',
  });
  console.log('Result 3:', { success: res3.success, provider: res3.provider, msgId: res3.messageId, error: res3.error });

  console.log('\nAll 3 sender tests finished.');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
