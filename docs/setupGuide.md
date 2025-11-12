# WhatsApp Sales Channel Setup Guide for Resort Owners

## Prerequisites

1. Node.js installed (version 12 or higher)
2. WhatsApp Business Cloud API, Twilio, or Gupshup account
3. Booking platform (custom or integrated with booking sites)

## Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Run `npm install` to install dependencies

## Configuration

1. Update `config/config.json` with your:
   - WhatsApp API credentials
   - Resort information
   - Timing preferences
   - Entry points

2. Customize `config/products.json` with your actual accommodations:
   - Suite and room names
   - Prices per night
   - Benefits
   - URLs
   - Categories (accommodation, experience)

## Running the Application

1. Execute `node app.js` to run the demonstration
2. The application will simulate all core flows

## Integration with Your Booking Platform

### Webhook Endpoints

Create HTTP endpoints on your server to receive events from your booking platform:

1. `POST /webhook/booking-started` - Triggered when a guest starts a booking
2. `POST /webhook/booking-abandoned` - Triggered when a guest abandons a booking
3. `POST /webhook/reservation-confirmed` - Triggered when a reservation is confirmed
4. `POST /webhook/guest-checked-in` - Triggered when a guest checks in

### Example Webhook Payloads

#### Booking Started
```json
{
  "customerPhone": "+1234567890",
  "cartItems": [
    {
      "id": 1,
      "name": "Suite Name",
      "price": 299.99
    }
  ],
  "cartUrl": "https://yourresort.com/booking/abc123"
}
```

#### Reservation Confirmed
```json
{
  "customerPhone": "+1234567890",
  "orderDetails": {
    "orderId": "RESERVATION-12345",
    "totalAmount": "$599.98",
    "estimatedDelivery": "Check-in: 2025-11-15",
    "items": [
      {
        "id": 1,
        "name": "Suite Name",
        "price": 299.99
      }
    ]
  }
}
```

## WhatsApp API Integration

The POC simulates API calls. To connect to the actual WhatsApp API:

1. Uncomment and implement the actual API calls in `api/whatsappClient.js`
2. Use the appropriate endpoint for your provider:
   - WhatsApp Cloud API: `https://graph.facebook.com/v20.0/PHONE_NUMBER_ID/messages`
   - Twilio: `https://api.twilio.com/2010-04-01/Accounts/ACCOUNT_SID/Messages.json`
   - Gupshup: `https://api.gupshup.io/sm/api/v1/template/msg`

3. Implement proper authentication for your chosen provider

## Customization

### Adding New Accommodation Categories

1. Add new category values to accommodations in `config/products.json`
2. Update the welcome message template buttons if needed
3. Modify `getCategoryDisplayName()` in `api/whatsappClient.js` to handle new categories

### Adjusting Timing

Modify the timing values in `config/config.json`:
- `cartReminder1Minutes`: Time before first booking reminder (default: 45)
- `cartReminder2Hours`: Time before second booking reminder (default: 20)
- `postPurchaseReviewDays`: Days after check-in for review request (default: 2)

## Testing

Run `node app.js` to see a demonstration of all flows:

1. Welcome message
2. Accommodation suggestions
3. Booking abandonment reminders
4. Reservation confirmation
5. Post-stay review request
6. Upsell offer

Each flow is simulated with realistic delays to show the sequence of events.