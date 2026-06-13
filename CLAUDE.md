# Project Configuration

## Tech Stack
- React Native (Expo)
- TypeScript
- Supabase (for backend)
- Custom hooks and components
- EAS (Expo Application Services) for deployment

## Folder Structure
```
/
├── app/                   # Core application logic
│   ├── (tabs)/            # Tab-based navigation
│   ├── _layout.tsx        # Root layout with theme provider
│   └── (feature folders)  # Scene segmentation, style selector, etc.
├── components/            # Reusable UI components
├── constants/             # Theme, colors, and constants
├── hooks/                 # Custom React hooks
├── lib/                   # Business logic and database
├── assets/                # Static assets (images, fonts)
├── scripts/               # Utility scripts
├── .eas/                  # EAS workflows
├── app.json               # Expo configuration
├── eas.json               # EAS Build/Submit config
└── package.json           # Dependencies
```

## Strict Typing & Linting Standards
- Enforce TypeScript strict mode (`"strict": true`)
- Use ESLint with:
  - `react`: latest rules
  - `typescript`: latest rules
  - `eslint-plugin-react-hooks`: latest
  - `eslint-plugin-import`: latest
- Require explicit types for all variables and function parameters
- Disallow any `any` types
- Enforce consistent naming conventions (PascalCase for components, camelCase for variables)
- Require explicit `interface` or `type` definitions for all data structures
- Enable `no-unused-vars`, `no-console`, and `no-debugger` rules
- Use `prefer-const` and `prefer-arrow-functions` where appropriate