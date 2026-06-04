# 🚀 Xtrawrkx Web Platform

A comprehensive professional development platform built with **Next.js 15**, **Firebase**, and **Cloudinary** offering events, resources, networking opportunities, and community engagement.

## ✨ Features

- 🎯 **Event Management** - Create, manage, and register for professional events
- 📚 **Resource Center** - Whitepapers, articles, reports, and industry insights
- 👥 **Team Management** - Dynamic team profiles with professional image uploads
- 🏢 **Service Catalog** - Showcase consulting services and engagement models
- 🌐 **Community Platform** - Multiple specialized communities (XEN, XevFin, XD&D, XevTG)
- 📱 **Responsive Design** - Optimized for all devices
- 🔐 **Admin Panel** - Complete content management system
- ☁️ **Cloud Integration** - Firebase Firestore & Cloudinary CDN

## 🚀 Quick Start

### 1. Install Dependencies

From the monorepo root:

```bash
npm install
npm run dev:landing
```

Or from this app:

```bash
cd apps/landing
npm run dev
```

### 2. Environment Setup

Copy the environment template and configure your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

```env
# Cloudinary Configuration (for file uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Strapi Backend Configuration (for authentication)
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337/api

# Firebase Configuration (for database)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin@xtrawrkx.com,admin2@xtrawrkx.com

# Application Configuration
NEXT_PUBLIC_USE_CMS_DATA=true
```

> **For Testing Only**: Use demo Cloudinary values:
>
> ```env
> NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=demo
> NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
> ```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Available Scripts

| Command         | Description                   |
| --------------- | ----------------------------- |
| `npm run dev`   | Start development server      |
| `npm run build` | Build for production          |
| `npm run start` | Start production server       |
| `npm run lint`  | Run ESLint code quality check |

## 🏗️ Project Structure

```
apps/landing/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin panel routes
│   ├── (primary)/         # Main website routes
│   └── (statics)/         # Static pages (privacy, terms)
├── src/
│   ├── components/        # React components
│   │   ├── common/        # Shared components
│   │   ├── layout/        # Layout components
│   │   ├── admin/         # Admin-specific components
│   │   └── [feature]/     # Feature-specific components
│   ├── services/          # API services
│   ├── data/              # Static data and configurations
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utility functions
├── public/                # Static assets
└── .env.example          # Environment template
```

## 🔧 Key Technologies

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4.1
- **Database**: Firebase Firestore
- **Authentication**: Strapi CMS (JWT)
- **File Storage**: Cloudinary CDN
- **Animation**: Framer Motion
- **Icons**: Iconify & Lucide React
- **Date Handling**: date-fns

## 🎯 Main Features

### Public Website

- **Homepage** - Hero, services overview, events, communities
- **About** - Company information, team, values, FAQ
- **Services** - Detailed service offerings with engagement models
- **Events** - Upcoming and past events with registration
- **Communities** - XEN, XevFin, XD&D, XevTG community pages
- **Resources** - Filterable library of professional content
- **Contact** - Contact form and company information
- **Teams** - Dynamic team member profiles

### Admin Panel (`/admin`)

- **Dashboard** - Overview and statistics
- **Events** - Create, edit, manage events
- **Services** - Manage service offerings
- **Team** - Add/edit team members with photo uploads
- **Resources** - Content management for articles and reports
- **Gallery** - Image management
- **Registrations** - View event registrations

## 🔐 Authentication & Access

- **Public Access**: All main website content
- **Admin Access**: Only emails listed in `NEXT_PUBLIC_ADMIN_EMAILS`
- **Protected Routes**: All `/admin/*` routes require authentication

## 📱 Responsive Design

The platform is fully responsive and optimized for:

- **Desktop**: Full-featured experience with hover effects
- **Tablet**: Adaptive layouts and touch-friendly interactions
- **Mobile**: Optimized mobile experience with collapsible navigation

## 🚨 Common Issues & Quick Fixes

### Image Upload Fails

- ✅ Check Cloudinary credentials in `.env.local`
- ✅ Ensure upload preset is "unsigned"
- ✅ Restart development server after env changes

### Admin Login Issues

- ✅ Verify your email is in `NEXT_PUBLIC_ADMIN_EMAILS`
- ✅ Check Strapi backend is running and accessible
- ✅ Verify `NEXT_PUBLIC_STRAPI_API_URL` is correctly set
- ✅ Ensure user exists in Strapi backend
- ✅ Clear browser cache and cookies

### Data Not Loading

- ✅ Check Firebase credentials
- ✅ Verify network connection
- ✅ Check browser console for errors

### Environment Variables Not Working

- ✅ Ensure `.env.local` is in the `client` directory
- ✅ All variables must start with `NEXT_PUBLIC_`
- ✅ Restart development server after changes

## 📚 Additional Resources

- **[Technical Documentation](./DOCUMENTATION.md)** - Detailed setup and architecture
- **[Next.js Documentation](https://nextjs.org/docs)** - Framework documentation
- **[Firebase Console](https://console.firebase.google.com/)** - Database management
- **[Cloudinary Dashboard](https://cloudinary.com/console)** - File management

## 🎉 Success Indicators

Your setup is working correctly when you can:

- ✅ Access the website at `localhost:3000`
- ✅ Navigate to all public pages without errors
- ✅ Log into admin panel with authorized email
- ✅ Upload images in admin forms
- ✅ Create and edit content through admin panel

## 🆘 Need Help?

1. **Check the browser console** for detailed error messages
2. **Review the [DOCUMENTATION.md](./DOCUMENTATION.md)** for technical details
3. **Verify environment variables** are correctly set
4. **Restart the development server** after any configuration changes

---

**Built with ❤️ by the Xtrawrkx Team**

This platform provides a complete solution for professional development, community engagement, and business growth. The modular architecture ensures easy maintenance and scalability for future enhancements.
