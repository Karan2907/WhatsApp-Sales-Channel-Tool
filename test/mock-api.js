const express = require('express');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// Mock products data
const mockProducts = [
  {
    "id": 1,
    "name": "Deluxe Ocean Suite",
    "price": 399.99,
    "benefit": "Stunning ocean views with private balcony and luxury amenities",
    "url": "https://yourresort.com/suites/ocean-view",
    "category": "accommodation",
    "imageUrl": "https://yourresort.com/images/ocean-view-suite.jpg"
  },
  {
    "id": 2,
    "name": "Garden View Room",
    "price": 249.99,
    "benefit": "Peaceful garden views with direct access to resort pools and spas",
    "url": "https://yourresort.com/rooms/garden-view",
    "category": "accommodation",
    "imageUrl": "https://yourresort.com/images/garden-room.jpg"
  },
  {
    "id": 3,
    "name": "Spa Treatment Package",
    "price": 179.99,
    "benefit": "Premium spa treatments including massage, facial and body scrub",
    "url": "https://yourresort.com/spa/packages",
    "category": "experience",
    "imageUrl": "https://yourresort.com/images/spa-package.jpg"
  }
];

// API endpoint to get products
app.get('/api/products', (req, res) => {
  console.log('Mock API: Products requested');
  res.json(mockProducts);
});

// API endpoint with Bearer token authentication
app.get('/api/products-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  if (token !== 'test-token-123') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  console.log('Mock API: Authenticated products requested');
  res.json(mockProducts);
});

// Start server
app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log(`Endpoints:`);
  console.log(`  - http://localhost:${port}/api/products (public)`);
  console.log(`  - http://localhost:${port}/api/products-auth (requires Bearer token: test-token-123)`);
});