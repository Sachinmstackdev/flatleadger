# FlatLedger - Shared Expense Tracker

A modern web application for tracking shared expenses among flatmates. Built with React, TypeScript, and Supabase.

## Features

- 📊 **Dashboard**: Overview of total expenses, balances, and recent transactions
- 💰 **Add Expenses**: Record new expenses with equal or custom splits
- 🛒 **Shopping List**: Shared shopping list for household items
- 📈 **History**: Complete expense history with filtering
- 👥 **Multi-user**: Support for multiple flatmates
- 💳 **Payment Integration**: Ready for Razorpay integration (India)

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings → API
4. Copy the "Project URL" and "anon public" key

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

## Database Schema

The application uses the following Supabase tables:

### expenses
- `id` (uuid, primary key)
- `description` (text)
- `amount` (numeric)
- `paid_by` (text)
- `date` (date)
- `time` (time)
- `split_amount` (numeric)
- `category` (text, nullable)
- `split_type` (text)
- `custom_splits` (jsonb, nullable)
- `is_loan` (boolean)
- `loan_to` (text[], nullable)
- `notes` (text, nullable)

### shopping_items
- `id` (uuid, primary key)
- `name` (text)
- `completed` (boolean)
- `added_by` (text)
- `date` (date)

## Users

The application is configured for 3 users (flatmates). You can modify the users in `src/data/users.ts`.

## Troubleshooting

### Dashboard Loading Issue
If the dashboard is stuck loading:
1. Check that your `.env` file exists and has correct Supabase credentials
2. Verify your Supabase project is active
3. Check browser console for error messages
4. Ensure your database tables are created with the correct schema

### Data Not Loading
- Verify your Supabase RLS (Row Level Security) policies allow read access
- Check that the `expenses` table exists in your Supabase project
- Ensure your API keys have the correct permissions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **State Management**: React Context + Custom Hooks

## Contributing

This is a personal project for flat expense tracking. Feel free to fork and modify for your own use.
