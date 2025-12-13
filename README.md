# MM Central Coast Landscape

A modern, AI-powered landscaping website for MM Central Coast Landscape (Santa Ynez Valley), built with Next.js 14.

## 🤖 Features

### AI Property Analysis
Automatically generates landscaping quotes using multi-source AI vision:
- **Verified Boundaries**: Integrates **Regrid Parcel API** for exact lot dimensions and APN.
- **3D Visualization**: Fetches **Google Aerial View** cinematic drone-style 3D videos.
- **Multi-Image Analysis**: Simultaneously analyzes satellite (3 zoom levels), street view (3 angles), and user-uploaded photos.
- **Detailed Estimates**: Lawn sqft, tree counts, fence length, and more.

### Intelligent Quoting
- **Instant Estimates**: Real-time pricing based on AI data.
- **Dump/Haul-Away**: Dedicated AI analyis for junk removal photos.
- **GPS Integration**: One-click "Use My Location" and photo geotagging.

## 🚀 Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Environment Variables:**
Create a `.env.local` file with:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
GOOGLE_AI_STUDIO_KEY=your_key
REGRID_API_KEY=your_key
RESEND_API_KEY=your_key
```

3. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **AI**: Google Gemini Vision Pro
- **Maps**: Google Maps JavaScript API, Static API, Aerial View API
- **Data**: Regrid Parcel API
- **Styling**: CSS Modules
- **Email**: Resend API

