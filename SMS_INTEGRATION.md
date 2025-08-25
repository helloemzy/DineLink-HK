# SMS Integration for DineLink Phone Verification

The current implementation uses a development bypass (any 6-digit code works). To integrate real SMS verification, here are the recommended providers for Hong Kong:

## Recommended SMS Providers

### 1. Twilio (Most Popular)
```bash
npm install twilio
```

```typescript
// Backend API route: /api/send-sms
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
  const { phone } = await request.json();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  await client.messages.create({
    body: `Your DineLink verification code: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER, // +852 number
    to: `+852${phone}`
  });
  
  // Store code in database/cache with expiry
  return Response.json({ success: true });
}
```

### 2. AWS SNS
```bash
npm install @aws-sdk/client-sns
```

```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: 'ap-east-1' }); // Hong Kong region

const command = new PublishCommand({
  PhoneNumber: `+852${phone}`,
  Message: `Your DineLink verification code: ${code}`
});
```

### 3. Firebase Phone Auth (Recommended for simplicity)
```bash
npm install firebase
```

```typescript
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

const auth = getAuth();
const appVerifier = new RecaptchaVerifier('recaptcha-container', {}, auth);

signInWithPhoneNumber(auth, `+852${phoneNumber}`, appVerifier)
  .then((confirmationResult) => {
    // SMS sent, prompt user for code
    window.confirmationResult = confirmationResult;
  });
```

## Implementation Steps

1. **Choose Provider** - Firebase is easiest for MVP, Twilio for production
2. **Add Environment Variables** - API keys, phone numbers
3. **Create Backend Route** - `/api/send-sms` and `/api/verify-sms`
4. **Update Frontend** - Replace current mock verification
5. **Add Rate Limiting** - Prevent SMS abuse
6. **Store Codes Securely** - Redis/database with TTL

## Hong Kong Specific Considerations

- Use `+852` country code
- Support local carriers: CSL, 3HK, SmarTone, PCCW
- Consider costs: ~$0.05-0.10 per SMS
- Compliance: PDPO (Personal Data Privacy Ordinance)

## Current Demo Mode

For testing, enter any 6-digit code (e.g., 123456) to continue past verification.