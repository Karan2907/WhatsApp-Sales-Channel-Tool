# WhatsApp Sales Channel Tool Deployment Guide

This guide explains how to deploy the WhatsApp Sales Channel Tool for Resort Owners using GitHub and Vercel.

## Prerequisites

1. GitHub account
2. Vercel account
3. WhatsApp Business API, Twilio, or Gupshup account
4. Booking platform with webhook capabilities

## Deployment Options

### Option 1: GitHub Repository + Vercel Deployment (Recommended)

1. **Fork the Repository**
   - Go to the GitHub repository
   - Click the "Fork" button to create your own copy

2. **Connect to Vercel**
   - Sign in to your Vercel account
   - Click "New Project"
   - Import your forked repository
   - Configure the project settings:
     - Framework Preset: Other
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: ./

3. **Configure Environment Variables**
   In your Vercel project settings, add the following environment variables based on your provider:

   **For WhatsApp Business API:**
   ```
   WHATSAPP_PROVIDER=whatsapp-cloud-api
   WHATSAPP_ACCESS_TOKEN=your_facebook_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

   **For Twilio:**
   ```
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_whatsapp_number
   ```

   **For Gupshup:**
   ```
   WHATSAPP_PROVIDER=gupshup
   GUPSHUP_API_KEY=your_gupshup_api_key
   GUPSHUP_APP_NAME=your_app_name
   ```

4. **Deploy**
   - Click "Deploy" to start the deployment process
   - Vercel will automatically deploy your application

### Option 2: Manual Deployment

1. **Create a New GitHub Repository**
   - Go to GitHub and create a new repository
   - Clone the repository to your local machine

2. **Upload Files**
   - Copy all files from the WhatsApp Sales Channel tool to your local repository
   - Commit and push the files to GitHub

3. **Connect to Vercel**
   - Follow steps 2-4 from Option 1

## Post-Deployment Configuration

### 1. Update Accommodation Catalog
Edit `config/products.json` to include your actual suites and rooms:
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

### 2. Configure Webhook Integration
Connect your booking platform to the webhook endpoints provided by your Vercel deployment:

- Booking Started: `https://your-vercel-url.vercel.app/webhook/booking-started`
- Booking Abandoned: `https://your-vercel-url.vercel.app/webhook/booking-abandoned`
- Reservation Confirmed: `https://your-vercel-url.vercel.app/webhook/reservation-confirmed`
- Guest Checked In: `https://your-vercel-url.vercel.app/webhook/guest-checked-in`

### 3. Create WhatsApp Message Templates
Create the following templates in your WhatsApp Business account:

1. `welcome_qualifier` - First contact message
2. `product_suggestions` - Suite and room recommendations
3. `cart_reminder_1` - First booking abandonment reminder
4. `cart_reminder_2` - Second booking abandonment reminder
5. `order_confirmation` - Booking confirmation
6. `post_purchase_review` - Review request
7. `upsell_offer` - Upsell suggestions

## Testing Your Deployment

1. **Health Check**
   Visit `https://your-vercel-url.vercel.app/health` to verify the server is running

2. **Run Demo**
   Clone your repository locally and run:
   ```bash
   npm install
   npm run demo
   ```

## Updating Your Deployment

1. **Code Updates**
   - Make changes to your local repository
   - Commit and push to GitHub
   - Vercel will automatically redeploy

2. **Configuration Updates**
   - Update environment variables in Vercel project settings
   - Redeploy the application

## Troubleshooting

### Common Issues

1. **Webhook Endpoints Not Working**
   - Verify your Vercel URL is correct
   - Check that your booking platform can reach the internet
   - Ensure proper authentication is configured

2. **WhatsApp Messages Not Sending**
   - Verify your provider credentials are correct
   - Check that your message templates are approved
   - Ensure your WhatsApp Business account is properly configured

3. **Environment Variables Not Loading**
   - Verify environment variable names match exactly
   - Check that values are not truncated
   - Redeploy after updating environment variables

### Support

For issues and questions, please refer to the documentation in the `docs/` directory or contact support.