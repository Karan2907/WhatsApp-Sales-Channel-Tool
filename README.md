# WhatsApp Sales Channel Tool

A desktop application that transforms WhatsApp into a powerful sales channel for resort owners through automated messaging flows.

## Features

- **Welcome & Qualification Flow** - Automated welcome message with intent qualification
- **Accommodation Showcase Flow** - Curated suite and room recommendations based on guest interest
- **Booking Abandonment Recovery** - Automated reminders for incomplete bookings
- **Reservation Management** - Automatic booking confirmations and check-in updates
- **Post-Stay Engagement** - Review requests and strategic upsell opportunities
- **Multi-Provider Support** - Works with WhatsApp Business API, Twilio, and Gupshup

## Installation

### Option 1: Download Pre-built Package (Recommended)

1. Download the latest release package from the [Releases](https://github.com/Karan2907/WhatsApp-Sales-Channel-Tool/releases) page
2. Extract the ZIP file to a location of your choice
3. Install Node.js (version 16 or higher) if not already installed
4. Run `start.bat` to launch the application

### Option 2: Build from Source

1. Clone or download this repository
2. Navigate to the project directory
3. Run `npm install` to install dependencies
4. Run `npm start` to start the desktop application

## Usage

1. Configure your WhatsApp provider settings through the application interface
2. Set up webhooks from your booking platform to the provided endpoints
3. Start engaging with your guests through automated WhatsApp flows

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

```bash
npm install
```

### Running the Desktop Application

```bash
npm start
```

### Packaging the Desktop Application

```bash
npm run package
```

This will create a packaged version of the application in the `dist/` directory.

## Configuration

The application can be configured through the settings interface. Supported providers include:

- WhatsApp Business API (Meta)
- Twilio
- Gupshup

## Webhook Endpoints

Once the application is running, configure your booking platform to send webhooks to these endpoints:

- Booking Started: `http://localhost:3000/webhook/booking-started`
- Booking Abandoned: `http://localhost:3000/webhook/booking-abandoned`
- Reservation Confirmed: `http://localhost:3000/webhook/reservation-confirmed`
- Guest Checked In: `http://localhost:3000/webhook/guest-checked-in`
- Health Check: `http://localhost:3000/health`

## Support

For issues and questions, please open an issue on GitHub or contact support.