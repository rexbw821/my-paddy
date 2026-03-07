# my paddy - Full Stack Guide

## Project Overview

This is a full-stack community fraud detection and reporting system with:

- **Backend**: Node.js + Express + Supabase
- **Frontend**: React + Vite
- **Database**: Supabase PostgreSQL (Single `reports` table)

## Quick Start

### 1. Start Backend (Port 3000)

```bash
# From project root
npm run dev:backend
```

### 2. Start Frontend (Port 5173)

```bash
# From project root/frontend
npm run dev
```

### 3. Open Browser

Visit: `http://localhost:5173`

## Folder Structure

```
my paddy/
├── src/
│   ├── index.js                 # Main backend server
├── frontend/
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── App.jsx             # Main app
│   │   └── main.jsx            # Entry point
│   ├── vite.config.js          # Vite config
│   ├── package.json            # Frontend dependencies
├── migrations/
│   └── 001_add_target_normalized.sql  # DB schema adjustments
├── submitReport.js             # Terminal tool: Submit new PENDING report
├── verifyReport.js             # Terminal tool: Check risk/status of a target
├── testSupabase.js             # Connection testing utility
├── .env                        # Environment variables
├── package.json                # Project scripts and dependencies
└── FULLSTACK_GUIDE.md          # This file
```

## Database Architecture

This project uses a **Single Source of Truth** via the `reports` table in Supabase.

### Security (RLS)

The database is secured with **Row Level Security (RLS)**:

- **Insert Policy**: Allows anyone to submit a report anonymously.
- **Select Policy**: Only allows viewing reports where `status` is `approved`.

### Advanced Logic

- **`search_reports` RPC**: A secure PostgreSQL function for robust, case-insensitive searching across all fields.
- **`trigger_normalize_report`**: Automatically cleans and normalizes data (phone numbers, casing) on every save.
- **`rate_limiting`**: Prevents duplicate reports for the same target from the same source within 10 minutes.

## Available Scripts

### Terminal Utilities

```bash
# Submit a new report (sets to PENDING)
npm run submit-report

# Verify a target (Robust search & Risk Level check)
npm run verify-report

# Test Supabase connection
npm run test-supabase
```

### Backend (Port 3000)

```bash
# Run backend server
npm run dev:backend

# Test API endpoint
curl -X POST http://localhost:3000/api/scam-check \
  -H "Content-Type: application/json" \
  -d '{"query":"1234567890"}'
```

### Frontend (Port 5173)

```bash
# Development
npm run dev:frontend

# Build for production
npm run build:frontend
```

## API Endpoints

### Search for Approved Reports

`POST /api/scam-check`
Returns only reports where `status` is `approved`.

### Submit New Report

`POST /api/reports`
Inserts a new record with `status` set to `pending`.

## Troubleshooting

### "Report not found" after submission

- Check your Supabase dashboard. New reports are `pending` by default.
- You must change the `status` column to `approved` for the report to be searchable.

### Credentials missing

- Ensure your `.env` file contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
