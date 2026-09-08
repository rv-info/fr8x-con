import nodemailer from 'nodemailer';

async function testSmtp() {
  const token = 'PHtE6r0MELi6jm8s9xMDsPXsEMHyN4wqrOtueAYR4YpHDKUBFk1RoogpwTOzrU8jAaETRf6cy4hpsr+U4uPTJTnsM2oZX2qyqK3sx/VYSPOZsbq6x00ZsFgScUffVIPpdtZq1SLRst7YNA==';
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.zeptomail.in',
    port: 587,
    secure: false,
    auth: {
      user: 'emailapikey',
      pass: token,
    },
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  });

  console.log('Testing connection to ZeptoMail SMTP (smtp.zeptomail.in:587)...');
  try {
    await transporter.verify();
    console.log('✅ ZeptoMail SMTP connection verified successfully!');

    console.log('Sending test email via ZeptoMail SMTP...');
    const info = await transporter.sendMail({
      from: '"FR8X Security" <password@fr8x.in>',
      to: 'tech@fr8x.in',
      subject: 'ZeptoMail SMTP Test',
      text: 'Test email sent via ZeptoMail SMTP relay.',
      html: '<div><b>Test email sent via ZeptoMail SMTP relay.</b></div>',
    });
    console.log('✅ Email successfully sent via SMTP!', info.messageId);
  } catch (err: any) {
    console.error('❌ ZeptoMail SMTP error:', err.message);
  }
}

testSmtp();
