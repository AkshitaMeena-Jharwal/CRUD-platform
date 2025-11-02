const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const prisma = new PrismaClient();

// FIXED: Use a consistent JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'crud-platform-super-secret-key-2024';

// Middleware to log requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// Initialize demo users on startup
async function initializeDemoUsers() {
  console.log('🌱 Checking demo users...');
  
  const demoUsers = [
    { email: 'admin@example.com', password: 'admin123', role: 'Admin' },
    { email: 'manager@example.com', password: 'manager123', role: 'Manager' },
    { email: 'viewer@example.com', password: 'viewer123', role: 'Viewer' },
  ];

  for (const userData of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
        },
      });
      console.log(`✅ Created demo user: ${userData.email}`);
    } else {
      console.log(`✅ Demo user already exists: ${userData.email}`);
    }
  }
}

// FIXED: Improved auth middleware with better error handling
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ No Authorization header provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Support both "Bearer token" and just "token"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      console.log('❌ No token found in Authorization header');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('🔐 Verifying token:', token.substring(0, 20) + '...');

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.email);
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please login again.' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token.' });
      } else {
        return res.status(401).json({ error: 'Token verification failed.' });
      }
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error.' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role = 'Viewer' } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    // FIXED: Consistent token generation
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for: ${email}`);

    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log(`🔍 User found: ${user.email}, checking password...`);

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ Login successful for: ${email}`);

    // FIXED: Consistent token payload and options
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: '24h',
      issuer: 'crud-platform',
      subject: user.id
    });

    console.log('✅ Token generated successfully');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a token verification endpoint
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
    message: 'Token is valid'
  });
});

// Simple test endpoint to check users (no auth required for debugging)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Model registry (unchanged)
class ModelRegistry {
  constructor() {
    this.modelsDir = path.join(__dirname, 'models');
    this.registeredModels = new Map();
    this.ensureModelsDir();
    this.loadExistingModels();
  }

  async ensureModelsDir() {
    try {
      await fs.access(this.modelsDir);
    } catch {
      await fs.mkdir(this.modelsDir, { recursive: true });
    }
  }

  async loadExistingModels() {
    try {
      const files = await fs.readdir(this.modelsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(
            path.join(this.modelsDir, file),
            'utf-8'
          );
          const model = JSON.parse(content);
          this.registeredModels.set(model.name, model);
        }
      }
      console.log(`📁 Loaded ${this.registeredModels.size} existing models`);
    } catch (error) {
      console.error('Error loading existing models:', error);
    }
  }

  async registerModel(model) {
    const tableName = model.tableName || `${model.name.toLowerCase()}s`;
    const modelWithTable = { ...model, tableName };

    const filePath = path.join(this.modelsDir, `${model.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(modelWithTable, null, 2));

    this.registeredModels.set(model.name, modelWithTable);
    console.log(`✅ Model ${model.name} registered and saved to ${filePath}`);
  }

  getModel(name) {
    return this.registeredModels.get(name);
  }

  getAllModels() {
    return Array.from(this.registeredModels.values());
  }
}

const modelRegistry = new ModelRegistry();

// Dynamic CRUD Service (simplified)
class DynamicCRUDService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async createRecord(model, data, req) {
    return {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getRecords(model, req, filters = {}) {
    return [];
  }

  async getRecordById(model, id, req) {
    return { id, message: "Record would be fetched from database" };
  }

  async updateRecord(model, id, data, req) {
    return { id, ...data, updatedAt: new Date() };
  }

  async deleteRecord(model, id, req) {
    return { message: "Record would be deleted from database" };
  }
}

const crudService = new DynamicCRUDService(prisma);

// Model management routes
app.post('/api/models', authMiddleware, async (req, res) => {
  try {
    const model = req.body;
    
    // Only allow Admin to create models
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admin can create models' });
    }

    await modelRegistry.registerModel(model);
    
    res.status(201).json({ 
      message: 'Model published successfully',
      model 
    });
  } catch (error) {
    console.error('❌ Model creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/models', authMiddleware, async (req, res) => {
  try {
    const models = modelRegistry.getAllModels();
    res.json(models);
  } catch (error) {
    console.error('❌ Models fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dynamic model routes
app.post('/api/:modelName', authMiddleware, async (req, res) => {
  try {
    const model = modelRegistry.getModel(req.params.modelName);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const record = await crudService.createRecord(model, req.body, req);
    res.status(201).json(record);
  } catch (error) {
    console.error('❌ Record creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/:modelName', authMiddleware, async (req, res) => {
  try {
    const model = modelRegistry.getModel(req.params.modelName);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const records = await crudService.getRecords(model, req, req.query);
    res.json(records);
  } catch (error) {
    console.error('❌ Records fetch error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CRUD Platform Server is running',
    timestamp: new Date().toISOString(),
    models: modelRegistry.getAllModels().length,
    jwtSecret: JWT_SECRET ? 'Set' : 'Not set'
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>CRUD Platform API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .success { color: green; }
        </style>
      </head>
      <body>
        <h1>🚀 CRUD Platform API</h1>
        <p class="success">Backend server is running successfully!</p>
        
        <h2>Available Endpoints:</h2>
        <div class="endpoint"><strong>GET</strong> /api/health - Health check</div>
        <div class="endpoint"><strong>POST</strong> /api/auth/login - Login user</div>
        <div class="endpoint"><strong>GET</strong> /api/auth/verify - Verify token</div>
        <div class="endpoint"><strong>POST</strong> /api/models - Create model (Admin only)</div>
        <div class="endpoint"><strong>GET</strong> /api/models - List all models</div>
        
        <p><a href="/api/health">Check API Health</a></p>
      </body>
    </html>
  `);
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize demo users
    await initializeDemoUsers();
    
    // Start the server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 JWT Secret: ${JWT_SECRET ? 'Set' : 'Not set'}`);
      console.log(`👤 Demo users ready for login`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();