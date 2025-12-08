# Campus Accessibility Map

A modern, interactive web application for mapping and managing accessibility features across a university campus. Built with Next.js, Supabase, and Leaflet, this platform enables students, faculty, and administrators to discover, contribute, and manage accessibility information in real-time.

## ✨ Features

### Core Functionality
- **Interactive Campus Map**: Explore accessibility features on an interactive Leaflet map with OpenStreetMap tiles
- **Accessibility Feature Management**: Create, view, edit, and delete accessibility markers (ramps, elevators, restrooms, parking, benches)
- **Building Management**: Add and manage campus buildings with polygon outlines
- **Photo Uploads**: Upload and manage multiple photos for each accessibility feature
- **Comments System**: Add comments to features for additional context and updates
- **Like System**: Like features to help others identify useful accessibility resources
- **Building Search**: Quick search functionality to find and navigate to specific buildings

### User Features
- **User Profiles**: View your contributions (features and comments) on your profile page
- **Profile Customization**: Upload avatar, set display name, and manage account settings
- **Theme Customization**: Choose from 3 color themes with dark mode and contrast level controls
- **Responsive Design**: Fully responsive interface optimized for desktop, tablet, and mobile devices

### Moderation & Reporting
- **Content Reporting**: Report inappropriate comments or features with required reason
- **Admin Moderation**: Dedicated moderation dashboard for administrators
- **Report Management**: View, resolve, and delete reported content

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Row Level Security, Edge Functions)
- **Map Library**: Leaflet with React-Leaflet
- **Styling**: Tailwind CSS with Material Design 3 (M3) color system
- **UI Components**: shadcn/ui components with custom M3 styling
- **Icons**: Lucide React, React Icons
- **State Management**: React Context API and hooks
- **Authentication**: Supabase Auth with email/password
- **File Storage**: Supabase Storage for photos and avatars
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- Git installed on your machine
- npm, yarn, or pnpm package manager
- Supabase CLI (for deploying Edge Functions)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd batch-2025-campus-accessibility-map-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

   You can find these values in your [Supabase project's API settings](https://supabase.com/dashboard/project/_/settings/api).

4. **Supabase Database Setup**
   
   The project includes migration files in the `supabase/migrations/` directory. Run these migrations in order:

   ```bash
   # Using Supabase CLI (recommended)
   supabase migration up
   
   # Or manually run each migration file in your Supabase SQL editor
   ```

   **Key Database Tables:**
   - `buildings` - Campus building information with polygon coordinates
   - `accessibility_features` - Accessibility markers (ramps, elevators, etc.)
   - `feature_photos` - Photos associated with accessibility features
   - `feature_comments` - User comments on features
   - `feature_likes` - User likes on features
   - `user_profiles` - User profile information
   - `comment_reports` - Reports on comments
   - `feature_reports` - Reports on features

5. **Storage Buckets Setup**
   
   Create the following storage buckets in Supabase:
   - `feature-photos` - For accessibility feature photos
   - `avatars` - For user profile pictures

   Set appropriate RLS policies for public read access and authenticated write access.

6. **Deploy Edge Functions**
   
   Deploy the account deletion Edge Function:
   ```bash
   supabase functions deploy delete_account
   ```

7. **Admin User Setup**
   
   To create an admin user, run the SQL script in `supabase/migrations/20251202143600_create_admin_user.sql` or manually set a user's role to 'admin' in the `auth.users` table metadata:
   
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{role}',
     '"admin"'
   )
   WHERE id = 'your-user-id';
   ```

## 🏃‍♂️ Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Create an account**
   - Sign up with email and password
   - Complete your profile setup
   - Start exploring and contributing!

## 📖 Usage

### For All Users:

1. **Explore the Map**
   - View accessibility features as colored markers on the map
   - Click markers to see feature details
   - Use the filter drawer to show/hide specific feature types
   - Search for buildings using the search button

2. **View Features**
   - Click any marker to open the feature modal
   - View photos, description, location, and comments
   - Like features you find helpful
   - Click photos to view them in full-screen

3. **Add Features**
   - Click the "Add Marker" button
   - Click on the map to place a feature
   - Fill in the form (title, type, description, photos)
   - Submit to add the feature

4. **Add Comments**
   - Open a feature modal
   - Scroll to the comments section
   - Type your comment and submit

5. **Report Content**
   - Click the report button (flag icon) on comments or features
   - Provide a reason for reporting
   - Submit the report for admin review

### For Administrators:

1. **Access Moderation Dashboard**
   - Navigate to "Moderation" from the sidebar
   - View all reported content (comments and features)
   - Filter by resolved/unresolved status

2. **Moderate Reports**
   - Review reported content and reasons
   - Resolve reports that don't require action
   - Delete inappropriate content
   - View deleted content status

3. **Manage Buildings**
   - Click "Add Building" button
   - Click on map to set building location
   - Draw polygon outline or fetch from OpenStreetMap
   - Add building name and description

## 📁 Project Structure

```
batch-2025-campus-accessibility-map-web/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/               # Login page
│   │   ├── forgot-password/     # Password recovery
│   │   └── update-password/     # Password update
│   ├── api/                     # API routes
│   │   ├── buildings/           # Building CRUD endpoints
│   │   ├── features/            # Feature CRUD endpoints
│   │   ├── profile/             # User profile endpoints
│   │   └── moderation/          # Moderation endpoints
│   ├── moderation/              # Admin moderation page
│   ├── profile/                 # User profile page
│   ├── settings/                # User settings page
│   └── page.tsx                 # Main map page
├── components/                   # React components
│   ├── map/                     # Map-related components
│   │   ├── CampusMap.tsx        # Main map component
│   │   ├── FeaturePopupContent.tsx  # Feature modal content
│   │   ├── BuildingModalContent.tsx # Building modal content
│   │   ├── FiltersDrawer.tsx    # Feature type filters
│   │   └── ...                  # Other map components
│   ├── ui/                      # Reusable UI components
│   │   ├── button.tsx           # Button component
│   │   ├── modal.tsx            # Modal component
│   │   ├── report-modal.tsx     # Report modal
│   │   └── ...                  # Other UI components
│   ├── sidebar.tsx              # Navigation sidebar
│   └── theme-selector.tsx       # Theme customization
├── lib/                         # Utility functions
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-theme.ts         # Theme management
│   │   └── use-admin.ts         # Admin check hook
│   ├── utils/                   # Utility functions
│   │   ├── theme.ts             # Theme generation
│   │   ├── feature-colors.ts    # Feature type colors
│   │   └── ...                  # Other utilities
│   └── supabase/                # Supabase configuration
├── supabase/
│   ├── functions/               # Supabase Edge Functions
│   │   └── delete_account/      # Account deletion function
│   └── migrations/              # Database migrations
├── types/                       # TypeScript definitions
│   ├── database.ts              # Database types
│   └── map.ts                   # Map-related types
└── public/                      # Static assets
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key | Yes |

**Note:** The service role key is automatically available in Supabase Edge Functions and does not need to be stored in your Next.js environment variables.

### Map Configuration

The map is configured for VSU (Visayas State University) campus by default. To customize for your campus, edit `types/map.ts`:

```typescript
export const VSU_CAMPUS_CONFIG: CampusMapConfig = {
  center: [latitude, longitude],  // Your campus center
  zoom: 17,
  minZoom: 17,
  maxZoom: 18,
  bounds: [[south, west], [north, east]],
  maxBounds: [[south, west], [north, east]],
  maxBoundsViscosity: 1.0,
}
```

### Feature Types

The application supports the following accessibility feature types:
- **Ramp** - Wheelchair ramps
- **Elevator** - Elevators
- **Accessible Restroom** - Accessible restroom facilities
- **Parking** - Accessible parking spaces
- **Restroom** - General restroom facilities
- **Bench** - Seating benches

## 🎨 Theming

The application uses Material Design 3 (M3) color system with:
- **3 Color Themes**: Default, Theme 2, and Theme 3
- **Dark Mode**: Toggle between light and dark themes
- **Contrast Levels**: Low, Medium, and High contrast options
- **Persistent Preferences**: Theme settings saved to localStorage

## 🔒 Security

- **Row Level Security (RLS)**: All database tables have RLS policies enabled
- **Authentication Required**: Most features require user authentication
- **Admin-only Features**: Moderation and building creation restricted to admins
- **Input Validation**: All API endpoints validate input data
- **Soft Deletion**: Content is soft-deleted, preserving data integrity
- **Edge Functions**: Sensitive operations (like account deletion) use Supabase Edge Functions to keep service role keys secure

## 📱 Mobile Support

- **Responsive Design**: Fully responsive across all screen sizes
- **Mobile Menu**: Hamburger menu for navigation on mobile
- **Touch-friendly**: Large touch targets and optimized interactions
- **Mobile Map**: Optimized map bounds and controls for mobile devices
- **Compact UI**: Streamlined interface for smaller screens

## 🚀 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

4. **Deploy Edge Functions**
   ```bash
   supabase functions deploy delete_account
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

### Database Migrations

After deployment, ensure all migrations are run on your production Supabase database:

```bash
# Using Supabase CLI
supabase db push

# Or manually run migrations in Supabase SQL editor
```

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Code Quality

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured with Next.js recommended rules
- **Code Style**: Consistent formatting and naming conventions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Leaflet](https://leafletjs.com/) for the mapping library
- [OpenStreetMap](https://www.openstreetmap.org/) for map tiles
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Material Design 3](https://m3.material.io/) for design system inspiration

## 📞 Support

If you encounter any issues or have questions:
- Check existing [GitHub Issues](https://github.com/your-repo/issues)
- Create a new issue with detailed information
- Contact the development team

## 🔮 Future Enhancements

Potential features for future development:
- Real-time collaboration features
- Advanced analytics and reporting
- Export functionality for accessibility reports
- Integration with campus navigation systems
- Mobile app version
- Accessibility audit tools
- Multi-language support

---

Made with ❤️ for accessible campus communities.
