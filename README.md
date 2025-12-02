# Portfolio Backend API

Modern ES6 Express.js backend with MongoDB, JWT authentication, and Vercel deployment support.

## 📁 Project Structure

```
portfolio-backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── env.js             # Environment configuration
├── middleware/
│   ├── auth.js            # JWT authentication middleware
│   └── corsConfig.js      # CORS configuration
├── models/
│   ├── User.js            # User model
│   └── ProjectRequest.js  # Project request model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── projects.js        # Client project routes
│   ├── admin.js           # Admin routes
│   └── migration.js       # Database migration routes
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore file
├── package.json          # Dependencies and scripts
├── server.js             # Main application entry
├── vercel.json           # Vercel deployment config
└── README.md             # This file
```

## 🚀 Features

- **ES6 Modules** - Modern JavaScript syntax
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access** - Client and Admin roles
- **MongoDB** - NoSQL database with Mongoose ODM
- **CORS Configuration** - Multi-origin support
- **Vercel Ready** - Zero-config deployment
- **Project Management** - Full CRUD operations
- **Payment Tracking** - Financial management
- **Progress Updates** - Weekly commit tracking

## 📦 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd portfolio-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_SECRET=your_admin_secret
PORT=5000
```

4. **Run the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /signup` - Client registration
- `POST /admin/signup` - Admin registration (requires ADMIN_SECRET)
- `POST /login` - Universal login
- `GET /profile` - Get user profile
- `PUT /profile/update` - Update profile
- `GET /verify` - Verify JWT token
- `POST /logout` - Logout user
- `GET /test` - API health check

### Client Project Routes (`/api/projects`)
- `POST /requests` - Submit new project
- `GET /requests` - Get all user projects
- `GET /requests/:id` - Get single project
- `GET /work` - Get accepted projects
- `GET /notifications` - Get notification counts
- `GET /:id/commits` - Get project commits

### Admin Routes (`/api/admin`)
- `GET /clients` - Get all clients
- `GET /clients/:id` - Get client details
- `GET /projects/requests` - Get all project requests
- `GET /projects/requests/:id` - Get single project
- `PUT /projects/requests/:id/accept` - Accept project
- `PUT /projects/requests/:id/negotiate` - Negotiate project
- `PUT /projects/requests/:id/reject` - Reject project
- `POST /projects/requests/:id/payment` - Add payment
- `POST /projects/requests/:id/commit` - Add progress update
- `PUT /projects/requests/:projectId/commit/:weekNumber` - Update commit
- `DELETE /projects/requests/:projectId/commit/:weekNumber` - Delete commit
- `GET /projects/statistics` - Get project statistics
- `GET /dashboard/stats` - Get dashboard stats

### Migration Routes (`/api/migrate`)
- `POST /fix-user-roles` - Fix existing user roles

## 🚢 Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Set Environment Variables in Vercel**
   - Go to your project settings on Vercel
   - Add all environment variables from `.env`

5. **Production Deployment**
```bash
vercel --prod
```

## 🔒 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Admin routes additionally require the user to have `role: 'admin'`.

## 📝 Usage Examples

### Client Signup
```javascript
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "contact": "+1234567890"
}
```

### Admin Signup
```javascript
POST /api/auth/admin/signup
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "adminpass123",
  "adminSecret": "your_admin_secret",
  "contact": "+1234567890"
}
```

### Submit Project Request
```javascript
POST /api/projects/requests
Headers: { Authorization: "Bearer <token>" }
{
  "projectName": "E-commerce Website",
  "duration": "3 months",
  "budget": 5000,
  "tools": "React, Node.js, MongoDB",
  "projectType": "Web Development",
  "description": "Need a full-stack e-commerce solution"
}
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start
```

## 📄 License

MIT License - feel free to use this project for your portfolio or commercial applications.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For any queries, please reach out through the contact form on the frontend application.