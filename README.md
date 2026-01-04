# SimpleEarn - Micro-Task and Earning Platform

SimpleEarn is a comprehensive micro-tasking and earning platform built with the MERN stack (MongoDB, Express.js, React, Node.js). The platform allows users to complete small tasks and earn money, with three distinct user roles: Worker, Buyer, and Admin.

## 🔗 Live Site URLs

- **Frontend**: [Add your frontend URL here]
- **Backend API**: [Add your backend API URL here]

## 📋 Admin Credentials

- **Email**: admin@simpleearn.com
- **Password**: [Set this after creating admin user]

> Note: Admin user needs to be created manually in the database or through the registration system and then updated to admin role.

## 🚀 Key Features

- **Multi-Role System**: Supports three distinct user roles - Worker, Buyer, and Admin - each with specialized dashboards and functionalities
- **Task Management**: Buyers can create, update, and delete tasks with detailed requirements and submission guidelines
- **Task Execution**: Workers can browse available tasks, view details, and submit completed work for review
- **Payment System**: Integrated Stripe payment gateway (with fallback dummy payment) for secure coin purchases
- **Withdrawal System**: Workers can withdraw earnings with multiple payment method support (Stripe, Bkash, Rocket, Nagad)
- **Review System**: Buyers can review worker submissions, approve or reject them, with automatic coin distribution
- **Notification System**: Real-time notifications for task submissions, approvals, rejections, and withdrawal approvals
- **Admin Dashboard**: Comprehensive admin panel to manage users, tasks, and withdrawal requests
- **Coin Management**: Automatic coin allocation on registration (Workers: 10 coins, Buyers: 50 coins) and transaction tracking
- **Image Upload**: Integrated ImgBB API for easy image uploading in registration and task creation
- **Responsive Design**: Fully responsive design that works seamlessly on mobile, tablet, and desktop devices
- **Authentication**: Secure authentication with Firebase (Email/Password and Google Sign-In)
- **Protected Routes**: Role-based route protection ensuring users only access authorized sections
- **Pagination**: Efficient pagination system for submissions list to handle large datasets
- **Modern UI/UX**: Beautiful and intuitive user interface built with Tailwind CSS and Framer Motion animations

## 🛠️ Technology Stack

### Frontend
- React 18+ with Vite
- Tailwind CSS for styling
- React Router for navigation
- Firebase Authentication
- Axios for API calls
- React Hook Form for form management
- Swiper for carousels and sliders
- Framer Motion for animations

### Backend
- Node.js with Express.js
- MongoDB Atlas (Native MongoDB Driver - No Mongoose)
- Firebase Admin SDK for authentication
- Stripe SDK for payments
- JWT for token management
- CORS enabled

### Additional Services
- Firebase (Authentication & Hosting)
- MongoDB Atlas (Database)
- Stripe (Payments)
- ImgBB (Image Upload)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Firebase project
- Stripe account (optional, dummy payment available)
- ImgBB API key (optional, URL input available)

### Backend Setup

1. Navigate to the server directory:
```bash
cd simpleEarn-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server root:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLIENT_URL=http://localhost:5173
```

4. Start the server:
```bash
npm start
# or for development
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd simpleEarn-client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the client root:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_IMGBB_API_KEY=your_imgbb_api_key
```

4. Start the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
simpleEarn/
├── simpleEarn-client/          # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── contexts/           # React contexts (Auth)
│   │   ├── layouts/            # Layout components
│   │   ├── pages/              # Page components
│   │   ├── utils/              # Utility functions
│   │   └── App.jsx             # Main App component
│   └── package.json
│
└── simpleEarn-server/          # Express backend application
    ├── config/                 # Native MongoDB configuration
    ├── routes/                 # API routes
    ├── controllers/            # Route controllers
    ├── middleware/             # Express middleware
    ├── utils/                  # Utility functions
    └── server.js               # Entry point
```

## 🔐 Authentication & Authorization

- Firebase Authentication handles user authentication
- Firebase Admin SDK verifies tokens on the server
- Role-based middleware protects routes (Worker, Buyer, Admin)
- JWT tokens stored in localStorage for session management

## 💰 Coin System

- **Registration Bonus**: Workers get 10 coins, Buyers get 50 coins
- **Coin Purchase**: Buyers can purchase coins (10 coins/$1, 150 coins/$10, 500 coins/$20, 1000 coins/$35)
- **Task Payment**: Workers earn coins when buyers approve their submissions
- **Withdrawal Rate**: 20 coins = 1 dollar (minimum withdrawal: 200 coins = $10)

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user info

### Tasks
- `GET /api/tasks/available` - Get available tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task (Buyer only)
- `PATCH /api/tasks/:id` - Update task (Buyer only)
- `DELETE /api/tasks/:id` - Delete task (Buyer/Admin)
- `GET /api/tasks/buyer/my-tasks` - Get buyer's tasks

### Submissions
- `POST /api/submissions` - Create submission (Worker only)
- `GET /api/submissions/worker/my-submissions` - Get worker submissions
- `GET /api/submissions/worker/stats` - Get worker statistics
- `GET /api/submissions/buyer/pending` - Get pending submissions (Buyer)
- `PATCH /api/submissions/:id/approve` - Approve submission (Buyer)
- `PATCH /api/submissions/:id/reject` - Reject submission (Buyer)

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history (Buyer)

### Withdrawals
- `POST /api/withdrawals` - Create withdrawal request (Worker)
- `GET /api/withdrawals/worker/my-withdrawals` - Get worker withdrawals
- `GET /api/withdrawals/pending` - Get pending withdrawals (Admin)
- `PATCH /api/withdrawals/:id/approve` - Approve withdrawal (Admin)

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/top-workers` - Get top 6 workers
- `PATCH /api/users/:id/role` - Update user role (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Notifications
- `GET /api/notifications/:email` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

## 🎯 User Roles & Features

### Worker
- Browse and view available tasks
- Submit completed tasks
- View submission history with pagination
- Track earnings and statistics
- Request withdrawals
- View notifications

### Buyer
- Create and manage tasks
- Review worker submissions
- Approve/reject submissions
- Purchase coins
- View payment history
- Track task statistics

### Admin
- Manage all users (view, delete, update roles)
- Manage all tasks (view, delete)
- Approve withdrawal requests
- View platform statistics

## 🔒 Security Features

- Environment variables for sensitive data
- Firebase token verification
- Role-based access control
- Protected API routes
- Input validation
- Secure password handling

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- Mobile devices (320px and up)
- Tablets (768px and up)
- Desktops (1024px and up)

## 🚢 Deployment

### Frontend Deployment (Firebase Hosting recommended)
1. Build the project: `npm run build`
2. Deploy to Firebase Hosting or your preferred platform

### Backend Deployment (Render/Railway/Vercel)
1. Set environment variables on your hosting platform
2. Deploy the server code
3. Update frontend API URL

## 📄 License

This project is created for educational and assessment purposes.

## 👨‍💻 Developer

[Your Name]
- GitHub: [Your GitHub Profile]
- LinkedIn: [Your LinkedIn Profile]

## 🤝 Contributing

This is an assessment project. Contributions are welcome for learning purposes.

## 📞 Support

For issues or questions, please open an issue on the GitHub repository.

---

**Note**: Make sure to configure all environment variables before running the application. The platform uses Firebase for authentication, so ensure your Firebase project is properly set up with Email/Password and Google Sign-In enabled.
