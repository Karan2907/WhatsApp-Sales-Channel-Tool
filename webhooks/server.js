/**
 * Webhook server for handling events from the resort booking website
 * This is the production implementation using Express.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const cartHandler = require('./cartHandler');
const orderHandler = require('./orderHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Load configuration
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Webhook endpoint for booking started
app.post('/webhook/booking-started', (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received booking started webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.cartItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event
    cartHandler.handleCartStarted(eventData);
    
    res.status(200).json({ message: 'Booking started event processed' });
  } catch (error) {
    console.error('Error processing booking started webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for booking abandoned
app.post('/webhook/booking-abandoned', (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received booking abandoned webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.cartItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event
    cartHandler.handleCartAbandoned(eventData);
    
    res.status(200).json({ message: 'Booking abandoned event processed' });
  } catch (error) {
    console.error('Error processing booking abandoned webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for reservation confirmed
app.post('/webhook/reservation-confirmed', (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received reservation confirmed webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.orderDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event
    orderHandler.handleOrderPlaced(eventData);
    
    res.status(200).json({ message: 'Reservation confirmed event processed' });
  } catch (error) {
    console.error('Error processing reservation confirmed webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for guest checked in
app.post('/webhook/guest-checked-in', (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received guest checked in webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.orderDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event
    orderHandler.handleOrderDelivered(eventData);
    
    res.status(200).json({ message: 'Guest checked in event processed' });
  } catch (error) {
    console.error('Error processing guest checked in webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});

module.exports = app;