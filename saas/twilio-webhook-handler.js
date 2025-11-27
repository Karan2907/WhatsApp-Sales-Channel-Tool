/**
 * Twilio Webhook Handler
 * Processes incoming webhooks from Twilio WhatsApp Business API
 */

const { firestore } = require('./firebase-config');
const fetch = require('node-fetch');

/**
 * Process incoming message from Twilio
 * Twilio webhook format:
 * {
 *   "MessageSid": "SMxxxxx",
 *   "From": "whatsapp:+919876543210",
 *   "To": "whatsapp:+911234567890",
 *   "Body": "message text",
 *   "NumMedia": "0",
 *   "MediaUrl0": "https://...",
 *   "ProfileName": "Customer Name",
 *   "WaId": "919876543210"
 * }
 */
async function handleIncomingMessage(webhookData, tenantId) {
  try {
    console.log(`[${tenantId}] Twilio webhook received:`, JSON.stringify(webhookData).substring(0, 500));
    
    const {
      MessageSid,      // Unique message ID
      From,            // Customer WhatsApp number (format: whatsapp:+919876543210)
      To,              // Business WhatsApp number (format: whatsapp:+911234567890)
      Body,            // Message text
      NumMedia,        // Number of media attachments
      ProfileName,     // Customer name
      WaId             // WhatsApp ID (phone number without whatsapp: prefix)
    } = webhookData;
    
    // Extract phone numbers (remove "whatsapp:" prefix)
    const customerPhone = From ? From.replace('whatsapp:', '') : 'unknown';
    const businessPhone = To ? To.replace('whatsapp:', '') : 'unknown';
    const customerName = ProfileName || 'Unknown';
    const messageText = Body || '';
    
    // Handle media attachments
    let mediaUrl = null;
    let messageType = 'text';
    
    if (NumMedia && parseInt(NumMedia) > 0) {
      mediaUrl = webhookData.MediaUrl0 || null;
      const mediaContentType = webhookData.MediaContentType0 || '';
      
      if (mediaContentType.startsWith('image/')) {
        messageType = 'image';
      } else if (mediaContentType.startsWith('video/')) {
        messageType = 'video';
      } else if (mediaContentType.startsWith('audio/')) {
        messageType = 'audio';
      } else {
        messageType = 'document';
      }
    }
    
    // Store the message in Firestore
    const messageDoc = {
      messageId: MessageSid || `msg_${Date.now()}`,
      from: customerPhone,
      to: businessPhone,
      customerName: customerName,
      waId: WaId || customerPhone.replace(/\+/g, ''),
      message: messageText,
      type: messageType,
      mediaUrl: mediaUrl,
      timestamp: new Date().toISOString(),
      direction: 'incoming',
      status: 'received',
      tenantId: tenantId,
      provider: 'twilio',
      createdAt: new Date().toISOString(),
      read: false,
      rawData: webhookData // Store raw webhook for debugging
    };
    
    // Save to messages collection
    const messagesCollection = firestore.collection('tenants').doc(tenantId).collection('messages');
    await messagesCollection.doc(messageDoc.messageId).set(messageDoc);
    
    console.log(`[${tenantId}] Message stored successfully: ${messageDoc.messageId}`);
    
    // Check if this is a booking-related message
    const messageTextLower = messageText.toLowerCase();
    
    if (messageTextLower.includes('book') || 
        messageTextLower.includes('reservation') || 
        messageTextLower.includes('room') ||
        messageTextLower.includes('pg') ||
        messageTextLower.includes('stay') ||
        messageTextLower.includes('available') ||
        messageTextLower.includes('price') ||
        messageTextLower.includes('cost') ||
        messageTextLower.includes('rent')) {
      
      // Check if booking lead already exists for this customer
      const bookingsCollection = firestore.collection('tenants').doc(tenantId).collection('bookings');
      const existingBookings = await bookingsCollection
        .where('customerPhone', '==', customerPhone)
        .where('status', '==', 'new')
        .get();
      
      if (existingBookings.empty) {
        // Create a new booking lead
        const bookingLead = {
          id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customerPhone: customerPhone,
          customerName: customerName,
          message: messageText,
          status: 'new',
          source: 'whatsapp',
          provider: 'twilio',
          messageId: messageDoc.messageId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await bookingsCollection.doc(bookingLead.id).set(bookingLead);
        console.log(`[${tenantId}] Booking lead created: ${bookingLead.id}`);
      } else {
        console.log(`[${tenantId}] Booking lead already exists for ${customerPhone}`);
      }
    }
    
    return {
      success: true,
      messageId: messageDoc.messageId
    };
    
  } catch (error) {
    console.error(`[${tenantId}] Error processing Twilio webhook:`, error);
    throw error;
  }
}

/**
 * Process message status update from Twilio
 * Twilio status callback format:
 * {
 *   "MessageSid": "SMxxxxx",
 *   "MessageStatus": "sent" | "delivered" | "read" | "failed",
 *   "ErrorCode": "30008" (if failed)
 * }
 */
async function handleStatusUpdate(webhookData, tenantId) {
  try {
    console.log(`[${tenantId}] Twilio status update:`, webhookData);
    
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage
    } = webhookData;
    
    if (!MessageSid) {
      console.warn(`[${tenantId}] No MessageSid in status update`);
      return { success: false, error: 'Missing MessageSid' };
    }
    
    // Update message status in Firestore
    const messagesCollection = firestore.collection('tenants').doc(tenantId).collection('messages');
    const messageRef = messagesCollection.doc(MessageSid);
    
    const updateData = {
      status: MessageStatus || 'unknown',
      statusUpdatedAt: new Date().toISOString()
    };
    
    if (MessageStatus === 'read') {
      updateData.read = true;
    }
    
    if (ErrorCode) {
      updateData.errorCode = ErrorCode;
      updateData.errorMessage = ErrorMessage || 'Unknown error';
    }
    
    await messageRef.update(updateData);
    
    console.log(`[${tenantId}] Message status updated: ${MessageSid} -> ${MessageStatus}`);
    
    return {
      success: true,
      messageId: MessageSid
    };
    
  } catch (error) {
    console.error(`[${tenantId}] Error processing status update:`, error);
    throw error;
  }
}

/**
 * Send message via Twilio API
 * API Endpoint: https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
 */
async function sendMessage(tenant, phoneNumber, messageText, mediaUrl = null) {
  try {
    const { whatsapp } = tenant;
    
    if (!whatsapp || !whatsapp.accountSid || !whatsapp.authToken) {
      throw new Error('Twilio credentials not configured');
    }
    
    if (!whatsapp.phoneNumber) {
      throw new Error('Twilio WhatsApp phone number not configured');
    }
    
    // Twilio API endpoint
    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${whatsapp.accountSid}/Messages.json`;
    
    // Ensure phone numbers have whatsapp: prefix
    const fromNumber = whatsapp.phoneNumber.startsWith('whatsapp:') 
      ? whatsapp.phoneNumber 
      : `whatsapp:${whatsapp.phoneNumber}`;
    
    const toNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;
    
    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('From', fromNumber);
    formData.append('To', toNumber);
    formData.append('Body', messageText);
    
    if (mediaUrl) {
      formData.append('MediaUrl', mediaUrl);
    }
    
    // Create Basic Auth header
    const authHeader = Buffer.from(`${whatsapp.accountSid}:${whatsapp.authToken}`).toString('base64');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Twilio API error: ${result.message || result.error || 'Unknown error'}`);
    }
    
    console.log(`[${tenant.id}] Message sent via Twilio:`, result);
    
    // Store sent message in Firestore
    if (result.sid) {
      const messageDoc = {
        messageId: result.sid,
        from: fromNumber,
        to: toNumber,
        message: messageText,
        type: mediaUrl ? 'media' : 'text',
        mediaUrl: mediaUrl,
        timestamp: new Date().toISOString(),
        direction: 'outgoing',
        status: result.status || 'sent',
        tenantId: tenant.id,
        provider: 'twilio',
        createdAt: new Date().toISOString()
      };
      
      const messagesCollection = firestore.collection('tenants').doc(tenant.id).collection('messages');
      await messagesCollection.doc(messageDoc.messageId).set(messageDoc);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error sending message via Twilio:', error);
    throw error;
  }
}

module.exports = {
  handleIncomingMessage,
  handleStatusUpdate,
  sendMessage
};
