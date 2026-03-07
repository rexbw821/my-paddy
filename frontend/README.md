# my paddy Frontend

A React + Vite frontend for the my paddy application. Allows users to search for scams and submit reports.

## Features

- **Search Scams**: Look up phone numbers, emails, URLs, or supplier names to check for reported scams
- **Submit Reports**: Report fraudulent activity with details and incident type
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Integration**: Communicates with the backend API on port 3000

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components (future expansion)
│   ├── pages/
│   │   ├── SearchScams.jsx  # Search functionality page
│   │   ├── SearchScams.css
│   │   ├── SubmitReport.jsx # Report submission page
│   │   └── SubmitReport.css
│   ├── App.jsx              # Main app component with routing
│   ├── App.css
│   ├── index.css            # Global styles
│   └── main.jsx             # Entry point
├── index.html               # HTML template
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies
└── .gitignore
```

## Installation

Dependencies are already installed. To reinstall if needed:

```bash
cd frontend
npm install
```

## Running the Frontend

### Development Mode

```bash
npm run dev
```

This starts the Vite dev server on `http://localhost:5173` with hot module reloading.

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Configuration

The frontend is configured to proxy API requests to the backend:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- API calls to `/api/*` are forwarded to the backend

## Usage

1. **Start the backend server** (from project root):
   ```bash
   node src/index.js
   ```

2. **Start the frontend** (from frontend directory):
   ```bash
   npm run dev
   ```

3. **Open browser** to `http://localhost:5173`

4. **Search for scams** or **submit a report**

## API Integration

The frontend communicates with the backend APIs:

- `POST /api/scam-check` - Search for scams
  - Request: `{ query: string }`
  - Response: `{ query, results: [], found: boolean, count: number }`

## Technologies

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **CSS3** - Styling and animations

## Future Enhancements

- Add user authentication
- Filter and sort search results
- User dashboard for submitted reports
- Map visualization of scam reports
- Mobile app version
- Dark mode support
