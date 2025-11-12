# WhatsApp Sales Channel Customization Guide for Resort Owners

This guide explains how to customize the proof-of-concept implementation for your specific resort business needs.

## 1. WhatsApp Provider Configuration

### WhatsApp Business Cloud API (Recommended)
1. Update `config/config.json`:
   ```json
   {
     "whatsapp": {
       "provider": "whatsapp-cloud-api",
       "apiEndpoint": "https://graph.facebook.com/v20.0",
       "accessToken": "YOUR_ACCESS_TOKEN",
       "phoneNumberId": "YOUR_PHONE_NUMBER_ID",
       "businessAccountId": "YOUR_BUSINESS_ACCOUNT_ID"
     }
   }
   ```

2. Implement actual API calls in `api/whatsappClient.js`:
   - Uncomment the actual HTTP request code
   - Remove the mock response simulation

### Twilio Setup
1. Update `config/config.json`:
   ```json
   {
     "whatsapp": {
       "provider": "twilio",
       "apiEndpoint": "https://api.twilio.com/2010-04-01/Accounts",
       "accessToken": "YOUR_TWILIO_AUTH_TOKEN",
       "accountSid": "YOUR_TWILIO_ACCOUNT_SID",
       "phoneNumber": "YOUR_TWILIO_WHATSAPP_NUMBER"
     }
   }
   ```

### Gupshup Setup
1. Update `config/config.json`:
   ```json
   {
     "whatsapp": {
       "provider": "gupshup",
       "apiEndpoint": "https://api.gupshup.io/sm/api/v1/template/msg",
       "apiKey": "YOUR_GUPSHUP_API_KEY",
       "appName": "YOUR_APP_NAME"
     }
   }
   ```

## 2. Brand Customization

Update the brand section in `config/config.json`:

```json
{
  "brand": {
    "name": "Your Resort Name",
    "tone": "premium", // Options: friendly, premium, relaxed
    "avoidWords": ["cheap", "discount", "sale"]
  }
}
```

## 3. Accommodation Catalog

Replace the sample accommodations in `config/products.json` with your actual suites and rooms:

```json
[
  {
    "id": 1,
    "name": "Your Actual Suite Name",
    "price": 299.99,
    "benefit": "Specific benefit that resonates with resort guests",
    "url": "https://yourresort.com/suites/actual-suite-url",
    "category": "accommodation", // Options: accommodation, experience
    "imageUrl": "https://yourresort.com/images/actual-suite-image.jpg"
  }
]
```

## 4. Timing Configuration

Adjust the timing values in `config/config.json` to match your business preferences:

```json
{
  "timings": {
    "cartReminder1Minutes": 30, // First booking reminder after 30 minutes
    "cartReminder2Hours": 24,   // Second reminder after 24 hours
    "postPurchaseReviewDays": 3 // Review request 3 days after check-in
  }
}
```

## 5. Entry Points

Configure which entry points you want to enable:

```json
{
  "entryPoints": {
    "whatsappButton": true,
    "qrCode": true,
    "clickToWhatsappAd": false
  }
}
```

## 6. Webhook Integration

Connect the webhook handlers to your actual booking platform:

### Booking Platform Integration
1. In your booking platform admin, go to Settings > Webhooks
2. Create webhooks for:
   - `booking/start` → POST to `https://your-server.com/webhook/booking-started`
   - `booking/abandon` → POST to `https://your-server.com/webhook/booking-abandoned`
   - `reservation/confirm` → POST to `https://your-server.com/webhook/reservation-confirmed`
   - `guest/checkin` → POST to `https://your-server.com/webhook/guest-checked-in`

### Custom Platform Integration
Implement event triggers in your platform that call the webhook endpoints:
- When a guest starts a booking
- When a guest abandons a booking (based on inactivity)
- When a reservation is confirmed
- When a guest checks in

## 7. Message Templates

Customize the message templates in your WhatsApp Business account to match your brand voice:

1. Create templates that match those described in `docs/messageTemplates.md`
2. Ensure the template names match exactly:
   - `welcome_qualifier`
   - `product_suggestions`
   - `cart_reminder_1`
   - `cart_reminder_2`
   - `order_confirmation`
   - `post_purchase_review`
   - `upsell_offer`

## 8. Deployment

### Hosting Options
1. Deploy to a cloud platform (AWS, Google Cloud, Azure)
2. Use a Platform-as-a-Service (Heroku, Vercel, Netlify)
3. Host on your own servers

### Required Environment
1. Node.js runtime (version 12 or higher)
2. Internet access for WhatsApp API calls
3. Publicly accessible endpoints for webhooks

### Security Considerations
1. Use HTTPS for all webhook endpoints
2. Implement authentication for webhook endpoints
3. Store API keys securely (environment variables)
4. Validate all incoming webhook data

## 9. Monitoring and Maintenance

### Logging
The application logs all activities to the console. For production:
1. Implement structured logging
2. Send logs to a monitoring service
3. Set up alerts for failures

### Error Handling
The current implementation includes basic error handling. For production:
1. Implement retry mechanisms for failed API calls
2. Add dead letter queues for persistent failures
3. Monitor delivery success rates

### Updates
1. Regularly review and update message templates
2. Monitor WhatsApp API changes
3. Update accommodation catalog as needed
4. Adjust timing based on guest response data

## 10. Scaling Considerations

For high-volume implementations:
1. Use a message queue (Redis, RabbitMQ) for webhook processing
2. Implement rate limiting for API calls
3. Add database storage for guest conversations
4. Consider load balancing for multiple instances