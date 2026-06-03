# Style Selector App

A streamlined Expo/React Native app for freelance clients to discover and select visual styles that match their preferences.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory and add your API credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

### 2. Database Setup (Supabase)

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key to the `.env` file

### 3. API Integration (n8n)

Set up an n8n workflow that:
- Accepts POST requests with: `clientName`, `textPrompt`, `selectedTags`
- Returns JSON response with: `{ "images": [{ "id": "string", "url": "string" }] }`

### 4. Installation & Running

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on specific platforms
npx expo start --ios     # iOS Simulator
npx expo start --android # Android Emulator  
npx expo start --web     # Web browser
```

## App Flow

1. **Welcome Screen** (`/`) - Client enters their name
2. **Input Screen** (`/input`) - Describe style preferences + select tags
3. **Results Screen** (`/results`) - Grid of matching style images
4. **Confirmation Screen** (`/confirmation`) - Selected style confirmation

## Tech Stack

- **Frontend**: Expo (React Native)
- **Database**: Supabase
- **API Integration**: n8n webhook
- **Navigation**: Expo Router (file-based routing)
- **Styling**: Custom design system with TypeScript

## Project Structure

```
/app/                 # Expo Router screens
  index.tsx           # Welcome screen
  input.tsx           # Style input form
  results.tsx         # Style results grid
  confirmation.tsx    # Selection confirmation
  _layout.tsx         # Root layout

/components/ui/       # Reusable UI components
  Button.tsx          # Primary/secondary buttons
  Tag.tsx             # Selectable style tags

/lib/api/            # API integrations
  supabase.ts        # Database operations
  n8n.ts             # Style search API

/styles/             # Shared styling helpers
  common.ts          # Reusable screen/text styles

/types/              # TypeScript definitions
/constants/          # Theme, colors, style tags
```

## Design Philosophy

- **Minimal & Clean** - Professional appearance with lots of white space
- **Functional First** - No decorative elements, focus on usability  
- **Mobile Optimized** - Touch-friendly interface with proper sizing
- **Accessible** - Clear typography and good contrast ratios

## API Response Format

Your n8n webhook should return:

```json
{
  "success": true,
  "images": [
    {
      "id": "unique-style-id",
      "url": "https://example.com/style-image.jpg",
      "title": "Optional Style Title"
    }
  ]
}
```

## Database Schema

The app stores client sessions with:
- Client name and search prompt
- Selected style tags (JSON array)
- Final selected style ID and URL
- Timestamp for analytics

## Development Notes

- Uses TypeScript for type safety
- Implements proper error handling for network issues
- Responsive design works on phones and tablets
- Follows Expo best practices for cross-platform compatibility
