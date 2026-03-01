# Zion Enterprise System — Project Documentation

## Project Overview
Zion is a high-performance streaming platform and admin enterprise system built with React and Supabase. It features an advanced telemetry engine, a relational advertising system, and a secured admin dashboard with role-based access control (RBAC).

---

## Tech Stack
- **Frontend**: React.js 18 (Vite.js)
- **Styling**: Tailwind CSS + Framer Motion (Glassmorphic UI)
- **Backend / Database**: Supabase (PostgreSQL + Auth + Storage)
- **API**: TMDB API for movie/TV metadata
- **Icons**: Lucide React

---

## Architecture & Security

### 1. Admin Isolation (Security)
To ensure maximum security and privacy, the project implements **Code Splitting**.
- **Lazy Loading**: All admin components (`AdminLogin`, `AdminAnalytics`, `AdminUsers`, etc.) are wrapped in `React.lazy`.
- **Bundle Isolation**: Regular users never download the admin code. The logic is only requested when visiting the `/birthna` route.
- **HMR Obfuscation**: In production, admin file structures are obfuscated, preventing leaks through network inspection.

### 2. Row Level Security (RLS)
The database uses a "Nuclear Reset" RLS strategy:
- **Profiles Protection**: Users can only view/edit their own profiles. Admins and Superadmins have cross-user visibility.
- **get_my_role() Helper**: A `SECURITY DEFINER` function that safely checks user roles without triggering infinite recursion.
- **Campaigns & Ads**: Public users can only read 'active' campaigns. CRUD operations are restricted to `admin` and `superadmin` roles.

---

## Database Schema Highlights

### Core Tables
- **public.profiles**: Extends Supabase Auth with custom roles (`superadmin`, `admin`, `moderator`).
- **public.ad_campaigns**: Relational table managing campaign status, budgets, and scheduling.
- **public.ad_creatives**: Child table for campaigns storing image URLs and tracking `click_count` and `impression_count`.
- **public.site_traffic_logs**: High-scale analytics table for user paths, device types, and regional data.
- **public.active_presence**: Real-time presence tracking with heartbeats.

---

## Key Features

### 1. Advanced Telemetry Engine
- **Universal Tracking**: Automatically logs visits to Home, Genres, Search, and Media grids.
- **Session Duration**: Tracks heartbeats on Watch pages to record "Time Spent".
- **Region Inference**: Records country/city data into JSONB fields.
- **Device Breakdown**: Intelligent Mobile/Desktop/Tablet classification.

### 2. Unified Trailer System
- **Autonomous Fetching**: Detects `movieId` and `mediaType` to fetch trailers directly from TMDB API headers.
- **Smooth Loading**: Implements an iframe loading state to eliminate "black screen" flickers.
- **Universal Modal**: Accessible across Hero, Movie Details, and TV Details sections.

### 3. Advertising System
- **Responsive Banners**: Refined container height (160px) with non-destructive scaling.
- **Campaign Scheduling**: Ads only appear if they are 'active' and within the start/end date range.
- **Admin Dashboard**: Full GUI for managing campaigns, creatives, and image uploads to Supabase Storage.

---

## Admin Roles (RBAC)
| Role | Capabilities |
|---|---|
| **Superadmin** | Full System Access + User Management + System Health |
| **Admin** | Campaign CRUD + Detailed Analytics |
| **Moderator** | Read-only access to Analytics; no system modification |

---

## Deployment & Setup

### Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_TMDB_API_KEY`

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```
This generates a secured, code-split bundle optimized for performance.
