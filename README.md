# MM Central Coast Landscape | AI-Powered Platform

*The future of landscaping and property services in the Santa Ynez Valley.*

## 🚀 Overview

A high-performance, premium web application built with **Next.js 15** and **SAM 3 Video Intelligence**. This platform automates property analysis, quoting, and operational management for MM Central Coast Landscape.

## 🤖 Core AI Technology

### SAM 3 Video Intelligence

- **Pixel-Accurate Segmentation**: Uses Meta's SAM 3 via Replicate to identify furniture, trees, debris, and landscapes from video input.
- **Multi-Service Router**: Intelligent routing for Landscaping, Junk Removal, Solar Cleaning, and Pressure Washing.

### Multi-Agent Consensus Engine

- **Features Agent**: Extracts property metrics (sqft, count, length).
- **Safety Agent**: Identifies hazards (power lines, chemicals).
- **Access Agent**: Checks vehicle clearance and gate width.
- **Seasonality Agent**: Recommends services based on foliage state.
- **Quality Agent**: Automated re-analysis for low-confidence outputs.
- **Activity Agent**: Behavioral intelligence that infers tasks (mowing, solar cleaning) from GPS pattern analysis.

## 🛠️ Operational Infrastructure (Phase 3)

- **Deployment Sentinel**: Real-time compliance monitoring ("Ghost" and "Out of Bounds" alerts).
- **Employee Geofencing**: Real-time location tracking for job site check-ins.
- **Time Clock**: Integrated shift management with geofence validation.
- **Job History Service**: Aggregated activity logs and time-on-task reporting.
- **QuickBooks Sync**: Automated invoicing and payroll integration.
- **Cost Accounting**: Real-time job profitability (P&L) reporting.

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env.local` and populate your API keys (Google Maps, Gemini, Replicate, etc.).

3. **Run Development:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Gemini 1.5 Pro, Vision Pro, SAM 3
- **Maps**: Google Maps JS SDK + Static API + Aerial View
- **Infrastructure**: ArcGIS/Parcel Data, Node-Next Backend
- **Styling**: Vanilla CSS (High-Performance)
