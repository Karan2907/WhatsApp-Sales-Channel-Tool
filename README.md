# WhatsApp Sales Channel Tool for Resort Owners

A downloadable tool that transforms WhatsApp into a powerful sales channel for your resort business through automated messaging flows.

## Features

- **Welcome & Qualification Flow** - Automated welcome message with intent qualification
- **Accommodation Showcase Flow** - Curated suite and room recommendations based on guest interest
- **Booking Abandonment Recovery** - Automated reminders for incomplete bookings
- **Reservation Management** - Automatic booking confirmations and check-in updates
- **Post-Stay Engagement** - Review requests and strategic upsell opportunities
- **Multi-Provider Support** - Works with WhatsApp Business API, Twilio, and Gupshup

## Prerequisites

- Node.js (version 16 or higher)
- WhatsApp Business Cloud API, Twilio, or Gupshup account
- Booking platform (website or custom system)

## Installation

### For Local Development

1. Clone or download this repository
2. Navigate to the project directory
3. Run `npm install` to install dependencies
4. Run `npm run setup` to configure your WhatsApp provider
5. Run `npm start` to start the server

### For Vercel Deployment

1. Fork this repository to your GitHub account
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel project settings:
   - `WHATSAPP_PROVIDER` - Your provider (whatsapp-cloud-api, twilio, or gupshup)
   - `WHATSAPP_ACCESS_TOKEN` - Your provider access token
   - `WHATSAPP_PHONE_NUMBER_ID` - Your WhatsApp phone number ID (for WhatsApp Business API)
   - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID (if using Twilio)
   - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token (if using Twilio)
   - `GUPSHUP_API_KEY` - Your Gupshup API Key (if using Gupshup)
4. Deploy the project

## Configuration

### Option 1: Interactive Setup (Recommended for local development)
Run the setup script:
```bash
npm run setup
```

### Option 2: Manual Configuration (For Vercel deployment)
Edit `config/config.json` with your provider credentials:

**For WhatsApp Business API:**
```json
{
  "whatsapp": {
    "provider": "whatsapp-cloud-api",
    "apiEndpoint": "https://graph.facebook.com/v20.0",
    "accessToken": "YOUR_FACEBOOK_ACCESS_TOKEN",
    "phoneNumberId": "YOUR_PHONE_NUMBER_ID"
  }
}
```

**For Twilio:**
```json
{
  "whatsapp": {
    "provider": "twilio",
    "apiEndpoint": "https://api.twilio.com/2010-04-01/Accounts",
    "accountSid": "YOUR_TWILIO_ACCOUNT_SID",
    "authToken": "YOUR_TWILIO_AUTH_TOKEN",
    "phoneNumber": "YOUR_TWILIO_WHATSAPP_NUMBER"
  }
}
```

**For Gupshup:**
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

## Starting the Server

```bash
npm start
```

The server will start on port 3000 (or the PORT environment variable if set).

## Webhook Integration

Connect your booking platform to these webhook endpoints:

- Booking Started: `http://your-server:3000/webhook/booking-started`
- Booking Abandoned: `http://your-server:3000/webhook/booking-abandoned`
- Reservation Confirmed: `http://your-server:3000/webhook/reservation-confirmed`
- Guest Checked In: `http://your-server:3000/webhook/guest-checked-in`

## Testing

Run the demo to see all flows in action:
```bash
npm run demo
```

## Required Message Templates

Create these templates in your WhatsApp Business account:

1. `welcome_qualifier` - First contact message
2. `product_suggestions` - Suite and room recommendations
3. `cart_reminder_1` - First booking abandonment reminder
4. `cart_reminder_2` - Second booking abandonment reminder
5. `order_confirmation` - Booking confirmation
6. `post_purchase_review` - Review request
7. `upsell_offer` - Upsell suggestions

## Accommodation Catalog

Update `config/products.json` with your actual suites and rooms:

```json
[
  {
    "id": 1,
    "name": "Your Suite Name",
    "price": 299.99,
    "benefit": "Brief suite benefit",
    "url": "https://yourresort.com/suites/your-suite",
    "category": "accommodation",
    "imageUrl": "https://yourresort.com/images/your-suite.jpg"
  }
]
```

Categories: accommodation, experience

## Development

For development with auto-restart:
```bash
npm run dev
```

## Support

For issues and questions, please refer to the documentation in the `docs/` directory or contact support.