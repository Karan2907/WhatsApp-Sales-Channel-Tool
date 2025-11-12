# WhatsApp Sales Channel Tool Installation Guide for Resort Owners

## System Requirements

- Node.js version 12 or higher
- npm (Node Package Manager)
- Internet connection for API calls
- WhatsApp Business API, Twilio, or Gupshup account

## Installation Steps

### 1. Install Node.js

If you don't have Node.js installed, download and install it from [nodejs.org](https://nodejs.org/)

Verify installation by running:
```bash
node --version
npm --version
```

### 2. Download the Tool

Download the latest release package and extract it to your desired location.

### 3. Install Dependencies

Navigate to the extracted folder and install dependencies:
```bash
cd whatsapp-sales-channel-tool
npm install
```

### 4. Configure the Tool

Run the interactive setup:
```bash
npm run setup
```

Or manually edit `config/config.json` with your provider credentials.

### 5. Customize Accommodation Catalog

Update `config/products.json` with your actual suites and rooms.

### 6. Start the Server

```bash
npm start
```

The server will start on port 3000 by default.

## Provider Configuration

### WhatsApp Business API (Meta)
1. Create a Facebook Business account
2. Set up WhatsApp Business API for your resort
3. Obtain Access Token and Phone Number ID
4. Configure in the tool

### Twilio
1. Create a Twilio account
2. Set up WhatsApp sandbox or production access
3. Obtain Account SID and Auth Token
4. Configure in the tool

### Gupshup
1. Create a Gupshup account
2. Set up WhatsApp API access for your resort
3. Obtain API Key and create an app
4. Configure in the tool

## Webhook Integration

Connect your booking platform to these endpoints:

- Booking Started: `http://your-server:3000/webhook/cart-started`
- Booking Abandoned: `http://your-server:3000/webhook/cart-abandoned`
- Reservation Confirmed: `http://your-server:3000/webhook/order-placed`
- Guest Checked In: `http://your-server:3000/webhook/order-delivered`

## Testing

Run the demo to verify everything works:
```bash
npm run demo
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT environment variable
2. **Configuration errors**: Run `npm run setup` again
3. **API connection issues**: Verify your credentials
4. **Module not found**: Run `npm install` again

### Support

For issues and questions, please refer to the documentation or contact support.