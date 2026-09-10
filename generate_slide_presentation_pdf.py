"""
================================================================================
CROP2GO - Official SIH 2026 Slide Deck Presentation PDF Generator
(16:9 Landscape Widescreen: 11 x 6.1875 inches / 792 x 445.5 pt)
Replicates and explains the Technical Approach Slide & AI Architecture
Team: Team Foxfin | Smart India Hackathon 2026
================================================================================
"""

import os
import sys
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

# Dimensions for 16:9 Widescreen Landscape (792 x 450 pts)
PAGE_WIDTH = 792
PAGE_HEIGHT = 450

class PresentationCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_slide_frame(num_pages)
            super().showPage()
        super().save()

    def draw_slide_frame(self, total_pages):
        self.saveState()
        # Header bar on non-title slides
        if self._pageNumber > 1:
            # Top Primary Dark Bar
            self.setFillColor(colors.HexColor("#064E3B"))  # Deep Emerald
            self.rect(0, PAGE_HEIGHT - 44, PAGE_WIDTH, 44, fill=True, stroke=False)
            
            # Accent Gold/Orange Line
            self.setFillColor(colors.HexColor("#F97316"))  # Warm Orange
            self.rect(0, PAGE_HEIGHT - 47, PAGE_WIDTH, 3, fill=True, stroke=False)

            # Header Titles
            self.setFont("Helvetica-Bold", 10)
            self.setFillColor(colors.white)
            self.drawString(28, PAGE_HEIGHT - 28, "CROP2GO — Integrated Agriculture Intelligence Platform")

            # Team Badge on Header Right
            self.setFont("Helvetica-Bold", 9)
            self.setFillColor(colors.HexColor("#FEF08A"))  # Light Yellow
            self.drawRightString(PAGE_WIDTH - 28, PAGE_HEIGHT - 28, "TEAM FOXFIN  |  SMART INDIA HACKATHON 2026")

            # Footer Dark Bar
            self.setFillColor(colors.HexColor("#0F172A"))  # Dark Slate
            self.rect(0, 0, PAGE_WIDTH, 22, fill=True, stroke=False)

            # Footer text
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#94A3B8"))
            self.drawString(28, 7, "CROP2GO  |  Crop Lifecycle to Post-Harvest Decisions, Connected  |  Confidential & Proprietary")

            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#F97316"))
            self.drawRightString(PAGE_WIDTH - 28, 7, f"Slide {self._pageNumber} of {total_pages}")

        self.restoreState()


def build_slide_presentation_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
        leftMargin=24,
        rightMargin=24,
        topMargin=54,
        bottomMargin=28
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_dark_green = colors.HexColor("#064E3B")
    c_primary = colors.HexColor("#047857")
    c_orange = colors.HexColor("#EA580C")
    c_blue = colors.HexColor("#1D4ED8")
    c_slate = colors.HexColor("#334155")
    c_bg_orange = colors.HexColor("#FFF7ED")
    c_bg_green = colors.HexColor("#F0FDF4")
    c_bg_blue = colors.HexColor("#EFF6FF")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor("#064E3B"),
        alignment=1
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#047857"),
        alignment=1
    )

    slide_heading = ParagraphStyle(
        'SlideHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#064E3B")
    )

    slide_subheading = ParagraphStyle(
        'SlideSubHeading',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748B")
    )

    card_title = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )

    card_body = ParagraphStyle(
        'CardBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor("#334155")
    )

    card_body_bold = ParagraphStyle(
        'CardBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # =========================================================================
    # SLIDE 1: COVER SLIDE
    # =========================================================================
    story.append(Spacer(1, 20))
    cover_table_data = [
        [Paragraph("<font size=11 color='#EA580C'><b>SMART INDIA HACKATHON 2026</b></font><br/><font size=9 color='#64748B'>Ministry of Agriculture &amp; Farmers Welfare</font>", ParagraphStyle('cov1', fontName='Helvetica', alignment=0)),
         Paragraph("<font size=11 color='#047857'><b>TEAM FOXFIN</b></font><br/><font size=9 color='#64748B'>Official Technical Architecture Deck</font>", ParagraphStyle('cov2', fontName='Helvetica', alignment=2))]
    ]
    t_cov = Table(cover_table_data, colWidths=[370, 370])
    t_cov.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_cov)

    story.append(Spacer(1, 40))
    story.append(Paragraph("🌾 CROP2GO", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Integrated Agriculture Intelligence Platform</b><br/>Crop Lifecycle to Post-Harvest Decisions, Connected", subtitle_style))
    story.append(Spacer(1, 30))

    meta_table_data = [
        [
            Paragraph("<b>Core Problem</b><br/>₹92,651 Cr Annual Post-Harvest Wastage &amp; Fragmented FPO Value Chains", card_body),
            Paragraph("<b>Key Solution</b><br/>LangGraph Multi-Agent RAG Orchestrator + AI Vision Grading + Smart Cold-Chain", card_body),
            Paragraph("<b>Target Audience</b><br/>Smallholder Farmers, FPO Leadership, Reefer Transporters &amp; Institutional Buyers", card_body)
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[240, 260, 240])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS', [6,6,6,6])
    ]))
    story.append(t_meta)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 2: MASTER TECHNICAL APPROACH SLIDE (REPLICA OF USER SLIDE)
    # =========================================================================
    story.append(Paragraph("TECHNICAL APPROACH — ARCHITECTURE OVERVIEW", slide_heading))
    story.append(Paragraph("End-to-End Orchestrated Pipeline: Multimodal Ingestion &rarr; LangGraph Agentic Workflow &rarr; Actionable Real-Time Outputs", slide_subheading))
    story.append(Spacer(1, 8))

    # Top 3 Columns: 1. Input | 2. LangGraph AI | 3. Output
    col1_content = [
        [Paragraph("<font color='#C2410C'><b>1. FARMER / FPO INPUT</b></font>", card_title)],
        [Paragraph("<b>📸 Produce Images:</b> Crop images for AI computer vision quality &amp; defect analysis", card_body)],
        [Paragraph("<b>📋 Crop &amp; Harvest Data:</b> Sowing, irrigation, crop protection &amp; harvest telemetry", card_body)],
        [Paragraph("<b>📡 Storage Sensor Readings:</b> Optional IoT temperature &amp; humidity monitoring", card_body)],
        [Paragraph("<b>🎙️ Voice / Text Input:</b> Multilingual regional speech (Hindi, Marathi, English)", card_body)]
    ]
    t_col1 = Table(col1_content, colWidths=[210])
    t_col1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#FFEDD5")),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#FFF7ED")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#F97316")),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#F97316")),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5)
    ]))

    col2_content = [
        [Paragraph("<font color='#047857'><b>2. AI WORKFLOW (LangGraph Orchestrator)</b></font>", card_title)],
        [Paragraph("<b>Crop Lifecycle &amp; Post-Harvest Decision Workflow</b>", card_body_bold)],
        [Paragraph("• <b>LLM Reasoning:</b> Understands context &amp; multi-turn queries in regional dialects<br/>• <b>RAG Architecture:</b> Real-time FPO records, APMC mandi prices, weather forecast<br/>• <b>System Tools:</b> Logistics API, Machinery registry, Agmarknet rates, Geofencing", card_body)],
        [Paragraph("<font color='#047857'><b>Feedback Loop:</b> Next Question (Clarify) &rarr; Update State (Maintain Context) &rarr; Generate Summary</font>", card_body_bold)]
    ]
    t_col2 = Table(col2_content, colWidths=[290])
    t_col2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#DCFCE7")),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#F0FDF4")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#10B981")),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#10B981")),
        ('PADDING', (0,0), (-1,-1), 4.5)
    ]))

    col3_content = [
        [Paragraph("<font color='#1D4ED8'><b>3. ACTIONABLE OUTPUTS</b></font>", card_title)],
        [Paragraph("<b>🌿 Crop Health &amp; Advisory:</b> Actionable alerts based on crop stage &amp; live weather", card_body)],
        [Paragraph("<b>📊 Sell / Store / Process Decision:</b> AI recommendation with confidence score &amp; margins", card_body)],
        [Paragraph("<b>🚜 Machinery &amp; Logistics Booking:</b> Available equipment slots &amp; cold-chain routes", card_body)],
        [Paragraph("<b>🌐 FPO Network &amp; Market Insights:</b> Nearby capacity, institutional buyer demand", card_body)],
        [Paragraph("<b>📑 Reports &amp; Digital Receipts:</b> Traceable multilingual summary vouchers &amp; ledger", card_body)]
    ]
    t_col3 = Table(col3_content, colWidths=[220])
    t_col3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#DBEAFE")),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#3B82F6")),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#3B82F6")),
        ('PADDING', (0,0), (-1,-1), 4)
    ]))

    t_main_grid = Table([[t_col1, t_col2, t_col3]], colWidths=[220, 300, 224])
    t_main_grid.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0)
    ]))
    story.append(t_main_grid)
    story.append(Spacer(1, 6))

    # Middle Pipeline Bar: Data Processing & AI Pipeline
    pipe_data = [
        [
            Paragraph("<b>DATA PROCESSING &amp; AI PIPELINE:</b>", ParagraphStyle('phead', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor("#065F46"))),
            Paragraph("📸 Image Preprocessing", card_body_bold),
            Paragraph("&rarr; 📄 OCR Slip Parsing", card_body_bold),
            Paragraph("&rarr; 🗃️ Entity Extraction", card_body_bold),
            Paragraph("&rarr; 🧬 Vector Embeddings", card_body_bold),
            Paragraph("&rarr; 🧠 LLM Reasoning", card_body_bold),
            Paragraph("&rarr; 📊 Decision Gen", card_body_bold),
            Paragraph("&rarr; 🔊 Studio TTS (Audio)", card_body_bold)
        ]
    ]
    t_pipe = Table(pipe_data, colWidths=[140, 85, 85, 85, 90, 85, 85, 89])
    t_pipe.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94A3B8")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 3.5)
    ]))
    story.append(t_pipe)
    story.append(Spacer(1, 6))

    # Bottom Row: Tech Stack Badges + Models & Technologies Box
    stack_data = [
        [
            Paragraph("<b>CORE TECH STACK:</b><br/>"
                      "• <b>Mobile:</b> Flutter (Cross-platform Android/iOS for farmers)<br/>"
                      "• <b>Web Dashboard:</b> React 18, Vite, Tailwind CSS, Leaflet GIS Maps<br/>"
                      "• <b>Backend API:</b> FastAPI &amp; Node.js Express Microservices<br/>"
                      "• <b>AI Orchestration:</b> LangGraph state machine &amp; LangChain agent tools<br/>"
                      "• <b>Cache &amp; Storage:</b> Redis (Live GPS &amp; Telemetry) + PostgreSQL / SQLite<br/>"
                      "• <b>DevOps &amp; Infra:</b> Docker containerization &amp; automated microservices", card_body),
            Paragraph("<b>MODELS &amp; AI TECHNOLOGIES:</b><br/>"
                      "• <b>LLM Engines:</b> Grok / GPT-4 / Llama 3 for multi-turn agri-reasoning<br/>"
                      "• <b>RAG &amp; Vector DB:</b> FAISS / Pinecone for contextual agronomy retrieval<br/>"
                      "• <b>Speech-to-Text:</b> Whisper (Multilingual Hindi/Marathi/English)<br/>"
                      "• <b>Text-to-Speech:</b> Studio HD Indic TTS Engine (Zero-latency cache)<br/>"
                      "• <b>OCR Vision:</b> Tesseract / PaddleOCR for physical weighing bridge slips<br/>"
                      "• <b>Embeddings &amp; APIs:</b> Gemini / OpenAI + Agmarknet + OpenWeather", card_body)
        ]
    ]
    t_stack = Table(stack_data, colWidths=[370, 374])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#64748B")),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#D97706")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_stack)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 3: PILLAR 1 — FARMER / FPO MULTIMODAL INGESTION
    # =========================================================================
    story.append(Paragraph("PILLAR 1 — FARMER &amp; FPO MULTIMODAL INGESTION ENGINE", slide_heading))
    story.append(Paragraph("Capturing Ground-Truth Agricultural Telemetry from Literate and Low-Literacy Stakeholders Alike", slide_subheading))
    story.append(Spacer(1, 10))

    p1_data = [
        [
            Paragraph("<b>Produce Image Capture (Computer Vision)</b><br/>"
                      "• Farm-gate smartphone camera captures lot samples.<br/>"
                      "• Auto-detects surface defects, rot, discoloration, sizing &amp; Agmark grade standards.<br/>"
                      "• Generates Grade A / B / C percentage distribution with confidence metrics.", card_body),
            Paragraph("<b>Crop &amp; Harvest Telemetry</b><br/>"
                      "• Sowing date, seed variety, area under cultivation (acres).<br/>"
                      "• Input logs: Fertilizer dosage, irrigation schedules, pesticide sprays.<br/>"
                      "• Digital Harvest Receipt generated with unique Lot ID (e.g. #TOM-0908).", card_body)
        ],
        [
            Paragraph("<b>Storage IoT Sensor Telemetry</b><br/>"
                      "• Cold-storage chamber temperature &amp; relative humidity logging.<br/>"
                      "• Microcontroller nodes (ESP32/DHT22) transmit continuous readings.<br/>"
                      "• Spoilage prediction algorithms flag batches exceeding critical thermal thresholds.", card_body),
            Paragraph("<b>Multilingual Hands-Free Voice Ingestion</b><br/>"
                      "• Regional dialect voice input for illiterate farmers and tractor drivers.<br/>"
                      "• Native Web Speech API &amp; Whisper STT supporting Hindi, Marathi, and English.<br/>"
                      "• Zero typing barrier: Voice login, voice crop logging, voice transport requests.", card_body)
        ]
    ]
    t_p1 = Table(p1_data, colWidths=[370, 374])
    t_p1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFF7ED")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#F97316")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#FED7AA")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_p1)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 4: PILLAR 2 — LANGGRAPH STATEFUL AGENTIC ORCHESTRATOR
    # =========================================================================
    story.append(Paragraph("PILLAR 2 — LANGGRAPH AI WORKFLOW &amp; MULTI-AGENT REASONING", slide_heading))
    story.append(Paragraph("Why Cyclical Graphs Beat Linear Chains: Stateful Context, Tool Execution &amp; Closed-Loop Decisions", slide_subheading))
    story.append(Spacer(1, 10))

    p2_data = [
        [
            Paragraph("<b>State Machine &amp; Multi-Turn Memory</b><br/>"
                      "• LangGraph maintains explicit state across complex post-harvest negotiations.<br/>"
                      "• Preserves context: Farmer profile, harvested tonnage, perishable shelf-life, and market distance.<br/>"
                      "• Evaluates if clarification is needed (e.g. asking farmer if produce is cold-stored before advising).", card_body),
            Paragraph("<b>RAG Knowledge Base &amp; Vector Embeddings</b><br/>"
                      "• Vector DB (FAISS / Pinecone) indexed with ICAR agricultural agronomy manuals.<br/>"
                      "• Combines dense semantic vector retrieval with sparse keyword lookups.<br/>"
                      "• Grounds LLM outputs in verified agronomic data, eliminating hallucination risks in financial advisory.", card_body)
        ],
        [
            Paragraph("<b>Tool Augmented Autonomous Execution</b><br/>"
                      "• Real-time Agmarknet mandi price queries across Azadpur, Vashi, and Bangalore APMC.<br/>"
                      "• Live OpenWeatherMap integration predicting sudden rainfall or heatwave warnings.<br/>"
                      "• FPO Warehouse Capacity Tool: dynamically queries cold room space before routing trucks.", card_body),
            Paragraph("<b>Iterative Decision Engine Loop</b><br/>"
                      "• <b>Node 1 (Analyze):</b> Ingests multimodal data &amp; extracts harvest constraints.<br/>"
                      "• <b>Node 2 (Query RAG &amp; APIs):</b> Fetches live market demand &amp; buyer credibility.<br/>"
                      "• <b>Node 3 (Synthesize):</b> Formulates optimum Sell / Store / Process trade-off recommendation.", card_body)
        ]
    ]
    t_p2 = Table(p2_data, colWidths=[370, 374])
    t_p2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0FDF4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#10B981")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#BBF7D0")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_p2)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 5: PILLAR 3 — HIGH-IMPACT ACTIONABLE OUTPUTS
    # =========================================================================
    story.append(Paragraph("PILLAR 3 — ACTIONABLE OPERATIONAL &amp; FINANCIAL OUTPUTS", slide_heading))
    story.append(Paragraph("Transforming AI Intelligence into Direct Revenue, Waste Reduction &amp; Verifiable Traceability", slide_subheading))
    story.append(Spacer(1, 10))

    p3_data = [
        [
            Paragraph("<b>1. Precision Sell / Store / Process Decision</b><br/>"
                      "• <b>Immediate Sell:</b> When mandi price spikes and shelf-life &lt; 48 hours.<br/>"
                      "• <b>Cold Storage:</b> When market is in temporary glut and prices projected to rise 18% in 7 days.<br/>"
                      "• <b>Agro-Processing (C-Grade):</b> Diverts C-grade tomatoes to puree units at ₹18/kg instead of dumping.", card_body),
            Paragraph("<b>2. Farm Machinery &amp; Shared Equipment Rental</b><br/>"
                      "• Uber-like pooling of tractors, rotavators, and boom sprayers.<br/>"
                      "• Real-time availability schedule by FPO hub, lowering smallholder mechanization costs by 40%.<br/>"
                      "• Integrated slot booking with transparent hourly billing.", card_body)
        ],
        [
            Paragraph("<b>3. Shared Logistics &amp; Live Reefer GPS Telemetry</b><br/>"
                      "• Live route optimization for multi-farmer aggregation pickup.<br/>"
                      "• Transporter GPS Transmitter streams continuous highway coordinates.<br/>"
                      "• Active reefer temperature monitoring ensures zero break in cold chain.", card_body),
            Paragraph("<b>4. Transparent Digital Bank Settlement</b><br/>"
                      "• Proportional farmer payout calculation based on audited Grade-A contribution to master lot.<br/>"
                      "• Direct UPI / Bank IMPS payment vouchers (e.g. ₹1,10,032 to Ramesh Patel).<br/>"
                      "• Eliminates middleman commissions and payment delays.", card_body)
        ]
    ]
    t_p3 = Table(p3_data, colWidths=[370, 374])
    t_p3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#BFDBFE")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_p3)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 6: DATA PIPELINE & INDIC MULTILINGUAL ENGINE
    # =========================================================================
    story.append(Paragraph("DATA PIPELINE &amp; NATIVE INDIC AUDIO ENGINE", slide_heading))
    story.append(Paragraph("Bridging the Digital Divide: OCR Document Parsing + Studio-Quality Native Hindi/Marathi Audio", slide_subheading))
    story.append(Spacer(1, 10))

    pipe_deep_data = [
        [
            Paragraph("<b>OCR Physical Mandi &amp; Scale Slip Parsing</b><br/>"
                      "• Tesseract / PaddleOCR parses paper weighing bridge tickets and APMC gate receipts.<br/>"
                      "• Regular Expression + NER extracts: Gross Weight, Tare Weight, Net Weight, Variety &amp; Date.<br/>"
                      "• Eliminates manual data entry errors at busy rural collection centres.", card_body),
            Paragraph("<b>Studio-Quality Native Speech Streamer (/api/tts)</b><br/>"
                      "• Bypasses robotic Windows English voices (David/Zira) entirely.<br/>"
                      "• Express backend `/api/tts` streams authentic human audio in Hindi, Marathi, and Indian English.<br/>"
                      "• In-memory LRU cache serves frequent responses in 0ms latency for smooth offline demo.", card_body)
        ],
        [
            Paragraph("<b>Multilingual Dialect Speech-to-Text (STT)</b><br/>"
                      "• Web Speech API + Whisper model configured for Indian accents.<br/>"
                      "• Supports Hindi Devanagari (फसल, मंडी भाव) and Romanized Hinglish phonetics.<br/>"
                      "• Robust fuzzy keyword intent matching triggers client-side route changes instantly.", card_body),
            Paragraph("<b>Full Traceability Graph (QR Code Ready)</b><br/>"
                      "• Farmer Batch &rarr; Weighing Bridge &rarr; AI Grading Card &rarr; Master Lot &rarr; Dispatch &rarr; Buyer.<br/>"
                      "• Complete cryptographic transparency protects both farmer payouts and institutional buyers.", card_body)
        ]
    ]
    t_pdeep = Table(pipe_deep_data, colWidths=[370, 374])
    t_pdeep.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#64748B")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_pdeep)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 7: VERDICT & JURY SUMMARY
    # =========================================================================
    story.append(Paragraph("SIH 2026 COMPETITIVE EDGE &amp; IMPACT SUMMARY", slide_heading))
    story.append(Paragraph("Why CROP2GO Solves Ministry Problem Statement with Unrivaled Depth and Feasibility", slide_subheading))
    story.append(Spacer(1, 10))

    impact_data = [
        [
            Paragraph("<font color='#065F46'><b>Metric / Impact</b></font>", card_title),
            Paragraph("<font color='#065F46'><b>Current Market Baseline</b></font>", card_title),
            Paragraph("<font color='#065F46'><b>CROP2GO Platform Result</b></font>", card_title),
            Paragraph("<font color='#065F46'><b>Technological Mechanism</b></font>", card_title)
        ],
        [
            Paragraph("<b>Post-Harvest Spoilage</b>", card_body_bold),
            Paragraph("25% - 30% perishables wasted before reaching retail", card_body),
            Paragraph("<font color='#047857'><b>Reduced to &lt; 5%</b></font>", card_body_bold),
            Paragraph("AI Sell/Store/Process optimization + Cold-Chain IoT", card_body)
        ],
        [
            Paragraph("<b>Farmer Net Realization</b>", card_body_bold),
            Paragraph("₹12 - ₹15 / kg for premium tomatoes (local APMC)", card_body),
            Paragraph("<font color='#047857'><b>Increased to ₹34.38 / kg (+35%)</b></font>", card_body_bold),
            Paragraph("Direct institutional buyer contracting (Reliance Fresh)", card_body)
        ],
        [
            Paragraph("<b>Low-Literacy Usability</b>", card_body_bold),
            Paragraph("Complex forms; 80% smallholders cannot use apps", card_body),
            Paragraph("<font color='#047857'><b>100% Hands-Free Voice Control</b></font>", card_body_bold),
            Paragraph("Web Speech STT + Studio Native Hindi/Marathi TTS", card_body)
        ],
        [
            Paragraph("<b>Payment Settlement Time</b>", card_body_bold),
            Paragraph("15 to 45 days through traditional traders / arthiyas", card_body),
            Paragraph("<font color='#047857'><b>Instant Direct Bank Settlement (&lt; 24h)</b></font>", card_body_bold),
            Paragraph("Automated master-lot contribution payout ledger", card_body)
        ]
    ]
    t_impact = Table(impact_data, colWidths=[160, 190, 194, 200])
    t_impact.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#DCFCE7")),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#065F46")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 6.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_impact)
    story.append(Spacer(1, 12))

    concl_data = [
        [
            Paragraph("<b>🏆 Team Foxfin Presentation Defense Note for Jury:</b><br/>"
                      "CROP2GO is not a static concept presentation — it is a fully functioning, end-to-end working system running live with simulated Pan-India telemetry, AI Computer Vision grading, 4 role portals (Farmer, FPO Admin, Transporter, Buyer), and instant audio copilot automation.", card_body)
        ]
    ]
    t_concl = Table(concl_data, colWidths=[744])
    t_concl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#D97706")),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(t_concl)

    doc.build(story, canvasmaker=PresentationCanvas)
    print(f"[SUCCESS] Slide Deck Presentation PDF created at: {output_path}")

if __name__ == '__main__':
    out_dir = r"C:\Users\abhij\.gemini\antigravity\scratch\CROP2GO\client\public"
    artifact_dir = r"C:\Users\abhij\.gemini\antigravity\brain\6d7c4065-77d3-41f0-b883-c14c788018b8"
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(artifact_dir, exist_ok=True)
    
    out_file = os.path.join(out_dir, "CROP2GO_Technical_Approach_Slide_Presentation.pdf")
    build_slide_presentation_pdf(out_file)

    import shutil
    artifact_file = os.path.join(artifact_dir, "CROP2GO_Technical_Approach_Slide_Presentation.pdf")
    shutil.copyfile(out_file, artifact_file)
    print(f"[SUCCESS] Copied to artifacts: {artifact_file}")
