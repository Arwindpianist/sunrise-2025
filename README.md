# Sunrise-2025 🌅

A comprehensive event management platform for creating, organizing, and sharing life's beautiful moments. Built with Next.js, Supabase, and modern web technologies.

## ✨ Features

### 🎉 Event Management
- **Smart Event Creation**: Create beautiful events with intuitive templates
- **Multi-Channel Messaging**: Send invitations via Email, WhatsApp, Telegram, and SMS
- **Automated Scheduling**: Smart reminders and follow-ups
- **Beautiful Templates**: Pre-designed for every occasion

### 👥 Smart Contact Management
- **Flexible Categories**: Create custom categories with color coding
- **Multiple Import Options**: 
  - Google Contacts integration
  - vCard (.vcf) file import
  - CSV file import
  - Manual contact addition
- **Contact Organization**: Color-coded categories for easy management
- **Shareable Forms**: Let contacts add themselves to your circle

### 📱 User Experience
- **Responsive Design**: Works perfectly on all devices
- **Real-time Updates**: Live notifications and status tracking
- **Secure Authentication**: Supabase Auth with social login options
- **Token-Based Pricing**: Pay only for what you use

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sunrise-2025.git
   cd sunrise-2025
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations in `supabase/migrations/`
   - Configure authentication providers
   - Set up email templates

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Frontend
- **Next.js 14**: App Router with Server Components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Beautiful icon library

### Backend
- **Supabase**: Database, authentication, and real-time features
- **PostgreSQL**: Primary database
- **Row Level Security**: Data protection
- **Edge Functions**: Serverless API endpoints

### Key Components
- **Contact Management**: Flexible categorization system
- **Event Creation**: Template-based event setup
- **Message Scheduling**: Multi-channel communication
- **Import Systems**: Google Contacts, vCard, CSV

## 📁 Project Structure

```
sunrise-2025/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── contact-form/      # Shareable contact forms
│   └── ...
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── category-manager.tsx
│   └── phone-import.tsx
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── supabase/             # Database migrations
```

## 🔧 Configuration

### Database Setup
Run the migrations in order:
```bash
supabase db push
```

### Authentication
Configure these providers in Supabase:
- Email/Password
- Google OAuth
- Additional providers as needed

### Email Integration
Set up Resend for email delivery:
1. Create a Resend account
2. Add your domain
3. Configure email templates

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
- [Radix UI](https://www.radix-ui.com/) for accessible components

## 📞 Support

For support, email support@sunrise-2025.com or create an issue in this repository.

---

Made with ❤️ for celebrating life's beautiful moments
