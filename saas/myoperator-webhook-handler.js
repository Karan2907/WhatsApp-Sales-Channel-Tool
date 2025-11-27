/**
 * MyOperator Webhook Handler
 * Processes incoming webhooks from MyOperator WhatsApp Business API
 */

const { firestore } = require('./firebase-config');
const fetch = require('node-fetch');

/**
 * Process incoming message from MyOperator
 * MyOperator webhook format:
 * {
 *   "type": "message",
 *   "source": "lc",
 *   "mode": "lc",
 *   "event": "received" or "sent",
 *   "timestamp": "2024-11-04T04:27:28.857052Z",
 *   "data": {
 *     "id": "message-id",
 *     "action": "incoming" or "outgoing",
 *     "status": "received",
 *     "data": {
 *       "type": "text",
 *       "context": { "body": "message text" }
 *     },
 *     "conversation": {
 *       "customer_country_code": "91",
 *       "customer_contact": "7900766070",
 *       "customer_name": "Name"
 *     },
 *     "phone_number_id": "411835805357155"
 *   }
 * }
 */
async function handleIncomingMessage(webhookData, tenantId) {
  try {
    console.log(`[${tenantId}] MyOperator webhook received:`, JSON.stringify(webhookData).substring(0, 500));
    
    // Extract data from MyOperator's nested structure
    const { type, event, timestamp, data } = webhookData;
    
    if (!data) {
      console.warn(`[${tenantId}] No data in webhook`);
      return { success: false, error: 'No data in webhook' };
    }
    
    const {
      id: message_id,
      action,
      status,
      data: messageData,
      conversation,
      phone_number_id,
      metadata
    } = data;
    
    // Only process incoming messages
    if (action !== 'incoming') {
      console.log(`[${tenantId}] Skipping ${action} message`);
      return { success: true, message: 'Not an incoming message' };
    }
    
    // Extract customer info
    const customerPhone = conversation ? `${conversation.customer_country_code}${conversation.customer_contact}` : 'unknown';
    const customerName = conversation?.customer_name || 'Unknown';
    
    // Extract message text based on type
    let messageText = '';
    let mediaUrl = null;
    let messageType = 'text';
    
    if (messageData) {
      messageType = messageData.type || 'text';
      
      if (messageType === 'text' && messageData.context) {
        messageText = messageData.context.body || '';
      } else if (messageType === 'image' && messageData.context) {
        messageText = messageData.context.caption || 'Image received';
        mediaUrl = messageData.context.link || messageData.context.id;
      } else if (messageType === 'video' && messageData.context) {
        messageText = messageData.context.caption || 'Video received';
        mediaUrl = messageData.context.link || messageData.context.id;
      } else if (messageType === 'document' && messageData.context) {
        messageText = messageData.context.caption || messageData.context.filename || 'Document received';
        mediaUrl = messageData.context.link || messageData.context.id;
      }
    }
    
    // Store the message in Firestore
    const messageDoc = {
      messageId: message_id || `msg_${Date.now()}`,
      from: customerPhone,
      phoneNumberId: phone_number_id,
      customerName: customerName,
      message: messageText,
      type: messageType,
      mediaUrl: mediaUrl,
      timestamp: timestamp || new Date().toISOString(),
      direction: 'incoming',
      status: status || 'received',
      tenantId: tenantId,
      conversationId: conversation?.id || null,
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
        messageTextLower.includes('cost')) {
      
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
          provider: 'myoperator',
          messageId: messageDoc.messageId,
          conversationId: conversation?.id || null,
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
    console.error(`[${tenantId}] Error processing MyOperator webhook:`, error);
    throw error;
  }
}

/**
 * Process message status update from MyOperator
 */
async function handleStatusUpdate(webhookData, tenantId) {
  try {
    console.log(`[${tenantId}] MyOperator status update:`, webhookData);
    
    const {
      message_id,
      status,        // sent, delivered, read, failed
      timestamp
    } = webhookData;
    
    if (!message_id) {
      console.warn(`[${tenantId}] No message_id in status update`);
      return { success: false, error: 'Missing message_id' };
    }
    
    // Update message status in Firestore
    const messagesCollection = firestore.collection('tenants').doc(tenantId).collection('messages');
    const messageRef = messagesCollection.doc(message_id);
    
    const updateData = {
      status: status || 'unknown',
      statusUpdatedAt: timestamp ? new Date(parseInt(timestamp) * 1000).toISOString() : new Date().toISOString()
    };
    
    if (status === 'read') {
      updateData.read = true;
    }
    
    await messageRef.update(updateData);
    
    console.log(`[${tenantId}] Message status updated: ${message_id} -> ${status}`);
    
    return {
      success: true,
      messageId: message_id
    };
    
  } catch (error) {
    console.error(`[${tenantId}] Error processing status update:`, error);
    throw error;
  }
}

/**
 * Send message via MyOperator API
 * API Endpoint: https://publicapi.myoperator.co/v1/whatsapp/send
 */
async function sendMessage(tenant, phoneNumber, messageText, mediaUrl = null) {
  try {
    const { whatsapp } = tenant;
    
    if (!whatsapp || !whatsapp.apiKey) {
      throw new Error('MyOperator API key not configured');
    }
    
    if (!whatsapp.phoneNumberId) {
      throw new Error('MyOperator Phone Number ID not configured');
    }
    
    // MyOperator send message endpoint
    const apiUrl = 'https://publicapi.myoperator.co/v1/whatsapp/send';
    
    const payload = {
      phone_number_id: whatsapp.phoneNumberId,
      to: phoneNumber.replace(/^\+/, ''), // Remove + if present
      type: mediaUrl ? 'media' : 'text',
      text: {
        body: messageText
      }
    };
    
    if (mediaUrl) {
      payload.media = {
        link: mediaUrl
      };
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${whatsapp.apiKey}`,
        'X-MYOP-COMPANY-ID': whatsapp.companyId || ''
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`MyOperator API error: ${result.message || result.error || 'Unknown error'}`);
    }
    
    console.log(`[${tenant.id}] Message sent via MyOperator:`, result);
    
    // Store sent message in Firestore
    if (result.message_id) {
      const messageDoc = {
        messageId: result.message_id,
        from: whatsapp.phoneNumberId,
        to: phoneNumber,
        message: messageText,
        type: mediaUrl ? 'media' : 'text',
        mediaUrl: mediaUrl,
        timestamp: new Date().toISOString(),
        direction: 'outgoing',
        status: 'sent',
        tenantId: tenant.id,
        createdAt: new Date().toISOString()
      };
      
      const messagesCollection = firestore.collection('tenants').doc(tenant.id).collection('messages');
      await messagesCollection.doc(messageDoc.messageId).set(messageDoc);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error sending message via MyOperator:', error);
    throw error;
  }
}

module.exports = {
  handleIncomingMessage,
  handleStatusUpdate,
  sendMessage
};
