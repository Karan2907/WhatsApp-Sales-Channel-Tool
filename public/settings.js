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

// Show/hide product API fields
function handleProductApiToggle() {
    const enabled = document.getElementById('productApiEnabled').checked;
    document.getElementById('product-api-fields').style.display = enabled ? 'block' : 'none';
}

// Show/hide authentication fields based on selected type
function handleAuthTypeChange() {
    // Hide all auth fields
    document.getElementById('bearer-token-field').style.display = 'none';
    document.getElementById('basic-auth-fields').style.display = 'none';
    document.getElementById('api-key-field').style.display = 'none';
    
    // Show selected auth fields
    const authType = document.getElementById('productApiAuthType').value;
    if (authType === 'bearer') {
        document.getElementById('bearer-token-field').style.display = 'block';
    } else if (authType === 'basic') {
        document.getElementById('basic-auth-fields').style.display = 'block';
    } else if (authType === 'apikey') {
        document.getElementById('api-key-field').style.display = 'block';
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
        },
        productApi: {
            enabled: document.getElementById('productApiEnabled').checked,
            url: formData.get('productApiUrl'),
            authType: formData.get('productApiAuthType'),
            bearerToken: formData.get('productApiBearerToken'),
            username: formData.get('productApiUsername'),
            password: formData.get('productApiPassword'),
            apiKeyHeader: formData.get('productApiKeyHeader'),
            apiKeyValue: formData.get('productApiKeyValue'),
            refreshInterval: parseInt(formData.get('productApiRefreshInterval')) || 60
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

// Load current settings from server
function loadCurrentSettings() {
    fetch('/api/settings')
        .then(response => response.json())
        .then(config => {
            // Populate form fields with current settings
            document.getElementById('provider').value = config.whatsapp.provider || '';
            document.getElementById('brandName').value = config.brand.name || '';
            document.getElementById('brandTone').value = config.brand.tone || 'friendly';
            
            // Provider-specific fields
            if (config.whatsapp.provider === 'whatsapp-cloud-api') {
                document.getElementById('accessToken').value = config.whatsapp.accessToken || '';
                document.getElementById('phoneNumberId').value = config.whatsapp.phoneNumberId || '';
                document.getElementById('businessAccountId').value = config.whatsapp.businessAccountId || '';
            } else if (config.whatsapp.provider === 'twilio') {
                document.getElementById('accountSid').value = config.whatsapp.accountSid || '';
                document.getElementById('authToken').value = config.whatsapp.authToken || '';
                document.getElementById('phoneNumber').value = config.whatsapp.phoneNumber || '';
            } else if (config.whatsapp.provider === 'gupshup') {
                document.getElementById('apiKey').value = config.whatsapp.apiKey || '';
                document.getElementById('appName').value = config.whatsapp.appName || '';
            }
            
            // Product API fields
            if (config.productApi) {
                document.getElementById('productApiEnabled').checked = config.productApi.enabled || false;
                document.getElementById('productApiUrl').value = config.productApi.url || '';
                document.getElementById('productApiAuthType').value = config.productApi.authType || 'none';
                document.getElementById('productApiBearerToken').value = config.productApi.bearerToken || '';
                document.getElementById('productApiUsername').value = config.productApi.username || '';
                document.getElementById('productApiPassword').value = config.productApi.password || '';
                document.getElementById('productApiKeyHeader').value = config.productApi.apiKeyHeader || '';
                document.getElementById('productApiKeyValue').value = config.productApi.apiKeyValue || '';
                document.getElementById('productApiRefreshInterval').value = config.productApi.refreshInterval || 60;
                
                // Show/hide product API fields based on enabled state
                handleProductApiToggle();
                
                // Show/hide auth fields based on selected type
                handleAuthTypeChange();
            }
            
            // Show the appropriate provider fields
            if (config.whatsapp.provider) {
                document.getElementById(config.whatsapp.provider + '-fields').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error loading settings:', error);
        });
}

// Set initial state when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const providerSelect = document.getElementById('provider');
    if (providerSelect) {
        providerSelect.addEventListener('change', handleProviderChange);
    }
    
    const productApiToggle = document.getElementById('productApiEnabled');
    if (productApiToggle) {
        productApiToggle.addEventListener('change', handleProductApiToggle);
    }
    
    const authTypeSelect = document.getElementById('productApiAuthType');
    if (authTypeSelect) {
        authTypeSelect.addEventListener('change', handleAuthTypeChange);
    }
    
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Load current settings
    loadCurrentSettings();
});