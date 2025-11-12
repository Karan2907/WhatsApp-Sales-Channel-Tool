// Show/hide provider-specific fields
function handleProviderChange() {
    // Hide all provider fields
    document.querySelectorAll('.provider-fields').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected provider fields
    const selectedProvider = document.getElementById('provider').value;
    if (selectedProvider) {
        document.getElementById(selectedProvider + '-fields').style.display = 'block';
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(document.getElementById('settingsForm'));
    const provider = formData.get('provider');
    
    // Build settings object
    const settings = {
        whatsapp: {
            provider: provider
        },
        brand: {
            name: formData.get('brandName'),
            tone: formData.get('brandTone')
        }
    };
    
    // Add provider-specific fields
    if (provider === 'whatsapp-cloud-api') {
        settings.whatsapp.apiEndpoint = 'https://graph.facebook.com/v20.0';
        settings.whatsapp.accessToken = formData.get('accessToken');
        settings.whatsapp.phoneNumberId = formData.get('phoneNumberId');
        settings.whatsapp.businessAccountId = formData.get('businessAccountId');
    } else if (provider === 'twilio') {
        settings.whatsapp.apiEndpoint = 'https://api.twilio.com/2010-04-01/Accounts';
        settings.whatsapp.accountSid = formData.get('accountSid');
        settings.whatsapp.authToken = formData.get('authToken');
        settings.whatsapp.phoneNumber = formData.get('phoneNumber');
    } else if (provider === 'gupshup') {
        settings.whatsapp.apiEndpoint = 'https://api.gupshup.io/sm/api/v1/template/msg';
        settings.whatsapp.apiKey = formData.get('apiKey');
        settings.whatsapp.appName = formData.get('appName');
    }
    
    // Send settings to server
    fetch('/api/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    })
    .then(response => response.json())
    .then(data => {
        // Safer way to update message content to comply with CSP
        const messageElement = document.getElementById('message');
        messageElement.textContent = data.message;
        messageElement.className = 'success';
    })
    .catch(error => {
        // Safer way to update message content to comply with CSP
        const messageElement = document.getElementById('message');
        messageElement.textContent = 'Error saving settings: ' + error.message;
        messageElement.className = 'error';
    });
}

// Set initial state when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const providerSelect = document.getElementById('provider');
    if (providerSelect) {
        providerSelect.addEventListener('change', handleProviderChange);
    }
    
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Set initial state based on current provider
    const currentProvider = document.body.dataset.provider || '';
    if (currentProvider) {
        providerSelect.value = currentProvider;
        document.getElementById(currentProvider + '-fields').style.display = 'block';
    }
});