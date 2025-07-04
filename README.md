# CMS Dashboard Client

A standalone React TypeScript dashboard for interacting with the Minimal CMS API. Built with Google's Material Design system.

## Overview

This is a **completely independent** client application that consumes the Minimal CMS API endpoints. It does not require any knowledge of the CMS internals - it simply uses the published API endpoints.

## Features

- 🎨 **Material-UI** - Google's Material Design components
- 📊 **Data Grid** - Sortable, filterable content list
- 🔄 **Real-time Updates** - Instant UI updates on CRUD operations
- 📱 **Responsive Design** - Works on all screen sizes
- 🎯 **Type Safety** - Full TypeScript support
- 🏗️ **Scalable Architecture** - Organized component structure

## Prerequisites

- Node.js 18+
- A running instance of the Minimal CMS API (default: http://localhost:3000)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:3000
```

Update `REACT_APP_API_URL` to point to your CMS API instance.

## Running the Client

### Development Mode

```bash
npm start
```

The client will start on http://localhost:3001

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

### Docker

```bash
# Using Docker Compose
docker-compose up

# Or build and run manually
docker build -t cms-client .
docker run -p 3001:80 -e REACT_APP_API_URL=http://localhost:3000 cms-client
```

## API Integration

This client expects the following POST endpoints from the CMS:

- `/content/create` - Create new content
- `/content/read` - Read content by ID
- `/content/update` - Update existing content
- `/content/delete` - Delete content
- `/content/list` - List all content (with optional type filter)

All endpoints expect JSON payloads and return JSON responses.

## Project Structure

```
client/
├── src/
│   ├── components/        # React components
│   │   ├── Layout/       # Layout components
│   │   └── Content/      # Content management components
│   ├── services/         # API service layer
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component
│   └── index.tsx        # Entry point
├── public/              # Static assets
└── package.json
```

## Available Features

### Content List View
- View all content items in a data grid
- Filter by content type (Text, Number, Date)
- Sort by any column
- Click rows to view details

### Create Content
- Select content type
- Add multiple fields dynamically
- Validation for all inputs
- Type-specific input controls

### Edit Content
- In-place editing
- Type-aware form controls
- Validation on save

### Delete Content
- Confirmation dialog
- Safe deletion with error handling

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI v5** - Component library
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **MUI X Data Grid** - Advanced data table

## Customization

To adapt this client for a different API:

1. Update the types in `src/types/index.ts`
2. Modify the API endpoints in `src/services/api.ts`
3. Adjust the components to match your data structure

## License

MIT
