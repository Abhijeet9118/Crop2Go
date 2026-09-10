# Crop2Go 🌾

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

> **Unified Post-Harvest Perishable Logistics, AI Quality Grading & 24-Hour Farmgate Settlement Platform.**  
> Built as Digital Public Infrastructure (DPI) compliant with Ministry of Agriculture & Farmers Welfare guidelines and the AgriStack standard.

---

## 🌟 Executive Summary

India loses over **₹1.5 lakh crore** annually in perishable produce due to fragmented cold-chains, opaque manual APMC grading, and predatory 15–45 day payment delays.

**Crop2Go** transforms this broken chain into a synchronized, transparent digital public grid:
1. **AI Visual Grading & Defect Segmentation:** Computer vision classifying lots into AGMARK Grade A, B, and C in < 1.8 seconds.
2. **Cryptographic QR Crop Passport:** Tamper-proof HMAC-SHA256 signatures binding harvest weight, grade, origin, and timestamp.
3. **Hardware-Free Reefer Tracking:** Truck drivers stream real-time GPS and container cold-chain telemetry using standard smartphone browsers without expensive proprietary tracking hardware.
4. **24-Hour Farmgate Direct Settlement:** Smart escrow contract locking buyer funds upfront and disbursing directly to farmers via Aadhaar-linked DBT upon digital proof-of-delivery.
5. **Full 23-Language Indic Architecture:** Native support for all 22 official Eighth Schedule Indian languages plus English, complete with dynamic RTL support for Urdu, Kashmiri, and Sindhi.

---

## 🏛️ System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │               INPUT LAYER                     │
                               │  • Farmer Mobile Intake  • IoT Cold Chain    │
                               │  • Agmarknet APMC APIs   • Geospatial Weather │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │       LANGGRAPH MULTI-AGENT STATEGRAPH       │
                               │  ┌─────────────────┐    ┌─────────────────┐  │
                               │  │ ChromaDB Vector │◄──►│ Dynamic Pricing │  │
                               │  │ RAG (ICAR Rules)│    │ & Spoilage Node │  │
                               │  └─────────────────┘    └────────┬────────┘  │
                               │            ▲                     │           │
                               │            └── Cyclic Validation ◄           │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           OUTPUT DECISION TRIAD              │
                               │  • Dynamic Perishable Fair Price Engine      │
                               │  • Tamper-Proof HMAC-SHA256 QR Passport      │
                               │  • Automated Escrow & 24h Farmgate DBT       │
                               └──────────────────────────────────────────────┘
```

---

## 🚀 Portals & Stakeholder Consoles

* **Farmer Portal (`/farmer`):** Crop logging, shared transport booking, digital weighbridge vouchers, and 24h DBT payment status.
* **FPO Aggregator (`/fpo`):** Electronic weighbridge lot creation, AI vision grading with confidence scoring, batch aggregation, and QR passport generation.
* **Institutional Buyer (`/buyer`):** Certified produce catalogue, direct escrow purchasing, and live reefer truck GPS tracking on Leaflet maps.
* **Transporter / Driver (`/transport`):** Zero-hardware progressive GPS telemetry transmission (15s polling) and container temperature monitoring.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS, Lucide React icons, React Hot Toast
- **Maps & Telemetry:** Leaflet.js & React-Leaflet
- **Localization:** Custom i18n Context with 23 language dictionaries (972 keys each)

### Backend
- **Runtime:** Node.js & Express REST API
- **Database:** SQLite with relational integrity (`sql.js` / `better-sqlite3`)
- **Security:** HMAC-SHA256 cryptographic signatures, JWT authentication, bcryptjs

---

## 💻 Local Setup & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhijeet9118/Crop2Go.git
   cd Crop2Go
   ```

2. **Install dependencies:**
   ```bash
   npm run setup
   ```
   *(Installs dependencies for both the backend server and the frontend client)*

3. **Start the development environment:**
   ```bash
   npm run dev
   ```
   * The **Frontend Client** runs on: `http://localhost:5173`
   * The **Backend API** runs on: `http://localhost:3001`

---

## 🔑 Demo & Testing Credentials

The login screen (`/login`) includes **1-click autofill cards** for instant testing:

| Role | Mobile Number | Password | Key Feature to Demo |
| :--- | :--- | :--- | :--- |
| **FPO Admin** | `9999900001` | `password123` | Lot `#TOM-0908`, AI Grading (96.4%), QR passport |
| **Farmer** | `9999900010` | `password123` | Crop logging, weighbridge vouchers, DBT settlement |
| **Buyer** | `9999900020` | `password123` | Certified lot purchase, escrow lock, reefer GPS |
| **Transporter** | `9999900040` | `password123` | Live smartphone GPS broadcast & temp telemetry |

---

## 🔬 Known Limitations & Future Scope

- **Edge Camera Hardware Heterogeneity:**
  - *Current:* Grades images captured under variable ambient lighting using software normalization.
  - *Future:* Implement standardized on-device white balance calibration cards for ultra-consistent field color grading.
- **Dynamic Multi-Mandi Spatial Arbitrage:**
  - *Future Plan:* Integrate a real-time graph algorithm calculating inter-mandi transit costs vs. price differentials to automatically recommend the most profitable wholesale market.
- **Decentralized Verifiable Credentials:**
  - *Future Plan:* Bridge HMAC QR passports to Polygon/Hedera distributed ledgers for immutable institutional provenance tracking.

---

## 📄 License
This project is open-sourced under the [MIT License](LICENSE).
