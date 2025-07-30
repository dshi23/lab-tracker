# Lab Tracker - Chemical Inventory Management System

A comprehensive full-stack web application for tracking laboratory chemical usage with intelligent inventory management, real-time analytics, and professional user experience. Built with Python Flask backend and React frontend.

## 🚀 Key Features

### 📦 **Intelligent Storage Management**
- **Unified Storage System**: Complete chemical inventory tracking with automatic quantity updates
- **Unit Consistency**: Automatic unit conversion and validation across all operations
- **Smart Deletion**: Comprehensive deletion logic with dependency checking and cascade options
- **Storage Analytics**: Low stock alerts, usage trends, and inventory turnover analysis

### 📝 **Advanced Record Management**
- **Unified API Endpoints**: Streamlined record creation with unit consistency
- **Professional Success Dialogs**: User-friendly feedback with action options (Edit/View Records)
- **Deprecated Endpoint Handling**: Graceful migration with detailed guidance
- **Atomic Operations**: Database transactions ensuring data consistency

### 🎨 **Professional User Experience**
- **Success Dialog System**: Professional feedback with clear action options
- **Mobile-First Design**: Responsive interface optimized for all devices
- **Touch-Friendly Interface**: Optimized for mobile and tablet interactions
- **Real-time Validation**: Instant feedback on form inputs and calculations

### 📊 **Comprehensive Analytics**
- **Dashboard Statistics**: Real-time usage analytics and trends
- **Personnel Tracking**: Individual usage statistics and patterns
- **Inventory Alerts**: Low stock notifications and usage warnings
- **Export Capabilities**: Excel import/export with template support

## 🏗️ Architecture

### **Backend Stack**
- **Framework**: Python Flask with RESTful API design
- **Database**: SQLAlchemy ORM with SQLite (dev) / PostgreSQL (prod)
- **Services**: Modular business logic with comprehensive error handling
- **Validation**: Robust data validation and unit consistency checks
- **Transactions**: Atomic database operations for data integrity

### **Frontend Stack**
- **Framework**: React with modern hooks and functional components
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for responsive, utility-first design
- **State Management**: React Query for server state management
- **Routing**: React Router for client-side navigation

## 📁 Project Structure

```
lab1/
├── backend/                 # Flask backend
│   ├── app.py              # Main Flask application
│   ├── config.py           # Configuration settings
│   ├── models.py           # Database models (Storage, UsageRecord)
│   ├── requirements.txt    # Python dependencies
│   ├── routes/             # API route blueprints
│   │   ├── storage.py      # Storage management endpoints
│   │   ├── records.py      # Usage records endpoints
│   │   ├── analytics.py    # Analytics and dashboard
│   │   └── import_export.py # Excel import/export
│   ├── services/           # Business logic services
│   │   ├── storage_service.py # Storage operations
│   │   └── excel_processor.py # Excel processing
│   ├── utils/              # Utility functions
│   │   ├── response_formatter.py # API response formatting
│   │   ├── date_parser.py  # Date parsing utilities
│   │   └── volume_converter.py # Unit conversion
│   └── run.py              # Application entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # UI components (SuccessDialog, LoadingSpinner)
│   │   │   ├── forms/      # Form components
│   │   │   ├── layout/     # Layout components
│   │   │   └── storage/    # Storage-specific components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite configuration
└── README.md              # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- **Python**: 3.8+ with pip
- **Node.js**: 16+ with npm or yarn
- **Git**: For version control

### Backend Setup

1. **Clone and navigate to backend:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run the Flask application:**
```bash
python run.py
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔌 API Endpoints

### Storage Management
- `GET /api/storage` - Get paginated storage items with filters
- `POST /api/storage` - Create new storage item
- `GET /api/storage/<id>` - Get specific storage item
- `PUT /api/storage/<id>` - Update storage item (partial updates)
- `DELETE /api/storage/<id>` - Delete storage item (with dependency checking)
- `GET /api/storage/<id>/deletion-info` - Get deletion impact analysis
- `POST /api/storage/<id>/use` - **Unified endpoint for usage recording**

### Records Management
- `GET /api/records` - Get paginated records with advanced filtering
- `GET /api/records/<id>` - Get specific record with storage information
- `PUT /api/records/<id>` - Update record with inventory adjustment
- `DELETE /api/records/<id>` - Delete record with inventory restoration
- `POST /api/records` - **Deprecated** (use `/api/storage/<id>/use` instead)

### Analytics & Dashboard
- `GET /api/analytics/dashboard` - Dashboard statistics and trends
- `GET /api/analytics/personnel` - Personnel usage analytics
- `GET /api/analytics/trends` - Usage trends over time
- `GET /api/inventory/dashboard` - Inventory management dashboard

### Data Import/Export
- `POST /api/storage/import` - Import storage items from Excel
- `GET /api/storage/export` - Export storage data to Excel
- `GET /api/storage/template` - Download Excel template

## 🎯 Key Improvements

### **1. Unified Storage System**
- **Complete CRUD Operations**: Full storage item management
- **Unit Consistency**: Automatic unit conversion and validation
- **Inventory Tracking**: Real-time quantity updates with usage records
- **Smart Deletion**: Comprehensive dependency checking with cascade options

### **2. Professional Success Dialogs**
- **Success Feedback**: Clear confirmation with record details
- **Action Options**: Edit Record and View Records buttons
- **Professional Design**: Modern UI with icons and responsive layout
- **Accessibility**: ARIA labels and keyboard navigation

### **3. Deprecated Endpoint Handling**
- **Graceful Migration**: Automatic proxy to new unified endpoints
- **Detailed Guidance**: Clear migration instructions and examples
- **Backward Compatibility**: Existing code continues to work
- **Error Handling**: Comprehensive error responses with suggestions

### **4. Enhanced Error Handling**
- **Atomic Operations**: Database transactions for data consistency
- **Detailed Logging**: Comprehensive error tracking and debugging
- **User-Friendly Messages**: Clear error explanations and solutions
- **Validation**: Robust input validation with helpful feedback

## 📊 Data Models

### Storage Items
```python
class Storage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    类型 = db.Column(db.String(100))          # Type (化学品, 试剂, etc.)
    产品名 = db.Column(db.String(200))        # Product Name
    数量及数量单位 = db.Column(db.String(50))  # Quantity with Unit
    存放地 = db.Column(db.String(100))        # Storage Location
    CAS号 = db.Column(db.String(50))         # CAS Number
    当前库存量 = db.Column(db.Float)          # Current Stock
    单位 = db.Column(db.String(10))          # Unit
    创建时间 = db.Column(db.DateTime)         # Creation Time
    更新时间 = db.Column(db.DateTime)         # Update Time
```

### Usage Records
```python
class UsageRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    storage_id = db.Column(db.Integer, db.ForeignKey('storage.id'))
    使用人 = db.Column(db.String(100))        # User
    使用日期 = db.Column(db.Date)             # Usage Date
    使用量_g = db.Column(db.Float)           # Amount Used
    余量_g = db.Column(db.Float)             # Remaining Amount
    备注 = db.Column(db.Text)                # Notes
```

## 🎨 UI Components

### **Success Dialog System**
- **Professional Design**: Modern modal with success icon
- **Record Details**: Shows created record information
- **Action Buttons**: Edit Record and View Records with icons
- **Responsive Layout**: Works on all device sizes
- **Accessibility**: Full keyboard navigation support

### **Storage Management**
- **Card-based Layout**: Clean storage item display
- **Real-time Updates**: Live quantity and status updates
- **Search & Filter**: Advanced filtering capabilities
- **Mobile Optimized**: Touch-friendly interface

### **Form Components**
- **Validation**: Real-time input validation
- **Unit Conversion**: Automatic unit handling
- **Error Handling**: Clear error messages and suggestions
- **Mobile Forms**: Optimized for mobile input

## 🔧 Development Features

### **Backend Development**
- **Service Layer**: Clean separation of business logic
- **Response Formatting**: Standardized API responses
- **Error Handling**: Comprehensive exception management
- **Logging**: Detailed logging for debugging
- **Testing**: Unit tests and integration tests

### **Frontend Development**
- **Component Architecture**: Modular, reusable components
- **State Management**: React Query for server state
- **Form Handling**: React Hook Form with validation
- **Error Boundaries**: Graceful error handling
- **Loading States**: Professional loading indicators

## 🚀 Deployment

### **Backend Deployment**

1. **Set environment variables:**
```bash
export FLASK_ENV=production
export DATABASE_URL=your_postgresql_url
export SECRET_KEY=your_secret_key
```

2. **Install production dependencies:**
```bash
pip install gunicorn
```

3. **Run with Gunicorn:**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### **Frontend Deployment**

1. **Build for production:**
```bash
npm run build
```

2. **Deploy the `dist` folder** to your hosting service (Netlify, Vercel, etc.)

## 📱 Mobile Features

- **Touch-Optimized**: Large touch targets and swipe gestures
- **Responsive Design**: Adapts to different screen sizes
- **Offline Support**: PWA with service worker for offline access
- **Mobile Navigation**: Bottom tab navigation for mobile devices
- **Pull-to-Refresh**: Refresh data with pull gesture

## 🔒 Security & Performance

- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Proper cross-origin handling
- **Error Handling**: Secure error responses
- **Performance**: Optimized database queries and caching

---
