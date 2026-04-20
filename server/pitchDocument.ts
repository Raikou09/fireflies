import PDFDocument from 'pdfkit';
import { Response } from 'express';

const BRAND_GREEN = '#16a34a';
const BRAND_DARK = '#0f172a';
const BRAND_ORANGE = '#f97316';
const BRAND_LIGHT_GREEN = '#dcfce7';
const GRAY = '#64748b';
const LIGHT_GRAY = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#1e293b';

function addPage(doc: InstanceType<typeof PDFDocument>) {
  doc.addPage({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 } });
}

function sectionHeader(doc: InstanceType<typeof PDFDocument>, title: string, color = BRAND_GREEN) {
  doc
    .rect(60, doc.y, 475, 36)
    .fill(color);
  doc
    .fillColor(WHITE)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(title.toUpperCase(), 72, doc.y - 28, { characterSpacing: 1.2 });
  doc.moveDown(1.2);
  doc.fillColor(TEXT_DARK);
}

function statBox(doc: InstanceType<typeof PDFDocument>, x: number, y: number, value: string, label: string, color = BRAND_GREEN) {
  doc.rect(x, y, 130, 72).fillAndStroke(LIGHT_GRAY, color);
  doc.fillColor(color).font('Helvetica-Bold').fontSize(22).text(value, x, y + 12, { width: 130, align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(label, x, y + 44, { width: 130, align: 'center' });
}

function bulletPoint(doc: InstanceType<typeof PDFDocument>, text: string, indent = 72) {
  const y = doc.y;
  doc.fillColor(BRAND_GREEN).fontSize(10).text('•', indent, y);
  doc.fillColor(TEXT_DARK).fontSize(10).text(text, indent + 14, y, { width: 461 - indent });
  doc.moveDown(0.3);
}

function featureCard(doc: InstanceType<typeof PDFDocument>, x: number, y: number, title: string, desc: string, color = BRAND_GREEN) {
  doc.rect(x, y, 215, 80).fillAndStroke(LIGHT_GRAY, color);
  doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(title, x + 10, y + 10, { width: 195 });
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(desc, x + 10, y + 28, { width: 195 });
}

export function generatePitchPDF(res: Response) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: 'SportsBox + Fireflies – Investor Pitch',
      Author: 'SportsBox & Fireflies',
      Subject: 'Investment Opportunity – Kenya Dual Booking Platform',
    },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="SportsBox-Fireflies-Pitch.pdf"');
  doc.pipe(res);

  // ─── COVER PAGE ───────────────────────────────────────────────────────────
  doc.rect(0, 0, 595, 842).fill(BRAND_DARK);

  // Green accent bar
  doc.rect(0, 260, 595, 6).fill(BRAND_GREEN);

  doc
    .fillColor(BRAND_GREEN)
    .font('Helvetica-Bold')
    .fontSize(44)
    .text('SportsBox', 60, 150, { align: 'center' });

  doc
    .fillColor(WHITE)
    .fontSize(18)
    .font('Helvetica')
    .text('&', 60, 205, { align: 'center' });

  doc
    .fillColor(BRAND_ORANGE)
    .font('Helvetica-Bold')
    .fontSize(44)
    .text('Fireflies', 60, 225, { align: 'center' });

  doc
    .fillColor(WHITE)
    .font('Helvetica')
    .fontSize(16)
    .text('Kenya\'s Premier Dual Booking Platform', 60, 285, { align: 'center' });

  doc
    .fillColor(GRAY)
    .font('Helvetica')
    .fontSize(12)
    .text('Sports Court Reservations  ·  Event Ticketing  ·  M-Pesa Payments', 60, 316, { align: 'center' });

  // Divider
  doc.rect(200, 360, 195, 1).fill(BRAND_GREEN);

  doc
    .fillColor(WHITE)
    .font('Helvetica-Bold')
    .fontSize(13)
    .text('INVESTOR PITCH DOCUMENT', 60, 380, { align: 'center', characterSpacing: 2 });

  doc
    .fillColor(GRAY)
    .font('Helvetica')
    .fontSize(11)
    .text('Connecting Kenya through Sport & Entertainment', 60, 408, { align: 'center' });

  // Bottom tagline
  doc
    .fillColor(BRAND_GREEN)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('NAIROBI  ·  MOMBASA  ·  KISUMU  ·  NAKURU  ·  ELDORET', 60, 760, { align: 'center', characterSpacing: 1.5 });

  doc
    .fillColor(GRAY)
    .font('Helvetica')
    .fontSize(9)
    .text('Confidential – For Investor Use Only', 60, 780, { align: 'center' });

  // ─── PAGE 2 – EXECUTIVE SUMMARY ──────────────────────────────────────────
  addPage(doc);

  sectionHeader(doc, '01  Executive Summary');

  doc
    .fillColor(TEXT_DARK)
    .font('Helvetica')
    .fontSize(11)
    .text(
      'SportsBox + Fireflies is a unified digital platform built for the Kenyan market that transforms how sports ' +
      'facilities and entertainment events are discovered, booked, and paid for. We connect court owners, event ' +
      'organisers, and thousands of sports-loving Kenyans through a seamless mobile-optimised experience — powered ' +
      'by M-Pesa, Kenya\'s dominant payment method.',
      { lineGap: 4 }
    );

  doc.moveDown(1);

  doc
    .fillColor(BRAND_GREEN)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Two Platforms. One Ecosystem.');

  doc.moveDown(0.5);

  doc
    .fillColor(TEXT_DARK)
    .font('Helvetica')
    .fontSize(11)
    .text(
      'SportsBox allows customers to search, book, and pay for sports courts — football pitches, tennis courts, ' +
      'basketball courts and more — across Kenyan cities, with real-time availability, equipment rentals, ' +
      'and GPS-based discovery.',
      { lineGap: 4 }
    );

  doc.moveDown(0.6);

  doc
    .fillColor(TEXT_DARK)
    .font('Helvetica')
    .fontSize(11)
    .text(
      'Fireflies is the companion event ticketing platform for concerts, sports events, theatre shows, and ' +
      'conferences — featuring interactive seat maps, tiered tickets (VIP, General, Early Bird), digital ' +
      'verification, and real-time sales analytics for organisers.',
      { lineGap: 4 }
    );

  doc.moveDown(1.2);

  // Stat boxes
  const statsY = doc.y;
  statBox(doc, 60, statsY, 'KSh 180B+', 'Kenya Sports Industry\n(Annual Value)', BRAND_GREEN);
  statBox(doc, 205, statsY, '15M+', 'Active Sports\nParticipants in Kenya', BRAND_GREEN);
  statBox(doc, 350, statsY, '65%', 'Kenyans Under 35\n(Primary Users)', BRAND_ORANGE);

  doc.y = statsY + 90;
  doc.moveDown(1);

  const stats2Y = doc.y;
  statBox(doc, 60, stats2Y, '5 Cities', 'Live Coverage:\nNairobi to Kisumu', BRAND_DARK);
  statBox(doc, 205, stats2Y, 'M-Pesa', 'Native Payment\nIntegration', BRAND_GREEN);
  statBox(doc, 350, stats2Y, '15+ Sports', 'Supported Across\nAll Platforms', BRAND_ORANGE);

  doc.y = stats2Y + 90;
  doc.moveDown(1.5);

  doc
    .rect(60, doc.y, 475, 52)
    .fill(BRAND_LIGHT_GREEN);
  doc
    .fillColor(BRAND_GREEN)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(
      '"We are building the infrastructure layer for sports and entertainment in East Africa — starting with Kenya."',
      72, doc.y - 42, { width: 451, align: 'center', lineGap: 3 }
    );
  doc.moveDown(1.5);

  // ─── PAGE 3 – PROBLEM & SOLUTION ─────────────────────────────────────────
  addPage(doc);

  sectionHeader(doc, '02  The Problem');

  const problems = [
    'Court owners manage bookings manually via WhatsApp and phone calls — leading to double bookings, missed revenue, and no data.',
    'Customers have no reliable way to discover available courts near them, check real-time availability, or pay digitally.',
    'Event organisers rely on cash ticket sales, paper tickets, and third-party agents — with no visibility into sales data.',
    'There is no unified platform in Kenya serving both sports facility management AND event ticketing under one ecosystem.',
    'Existing global solutions (e.g. Mindbody, Eventbrite) are not localised for Kenyan payment infrastructure (M-Pesa) or the informal sporting market.',
  ];

  problems.forEach(p => bulletPoint(doc, p));

  doc.moveDown(1);
  sectionHeader(doc, '03  Our Solution', BRAND_ORANGE);

  doc
    .fillColor(TEXT_DARK)
    .font('Helvetica')
    .fontSize(11)
    .text('SportsBox + Fireflies solves these problems with a purpose-built, Kenya-first platform:', { lineGap: 4 });
  doc.moveDown(0.5);

  const solutions = [
    ['Digital Court Management', 'Vendors list courts, set pricing (standard & peak hours), manage availability, upload photos, and track revenue — all from a single dashboard.'],
    ['GPS-Powered Discovery', 'Customers find courts within their chosen radius using live GPS location. Distance is calculated and sorted in real-time using the Haversine formula.'],
    ['M-Pesa STK Push Payments', 'Payments are collected via M-Pesa directly from the customer\'s phone — no card required. Receipts and confirmations are sent instantly.'],
    ['Event Ticketing with Seat Maps', 'Fireflies provides interactive venue seat maps, tiered ticket pricing (VIP / General / Early Bird), and digital QR ticket verification for event entry.'],
    ['Guest & Registered Bookings', 'Customers can book courts without an account. Registered users receive a 10% first-booking discount as a signup incentive.'],
    ['Automated Notifications', 'Email and SMS confirmations, reminders, vendor earning alerts, and booking receipts are sent automatically on every transaction.'],
  ];

  solutions.forEach(([title, desc]) => {
    doc
      .fillColor(BRAND_GREEN)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`▸ ${title}`, 72);
    doc
      .fillColor(TEXT_DARK)
      .font('Helvetica')
      .fontSize(10)
      .text(desc, 86, doc.y, { width: 447, lineGap: 2 });
    doc.moveDown(0.5);
  });

  // ─── PAGE 4 – PLATFORM FEATURES ──────────────────────────────────────────
  addPage(doc);

  sectionHeader(doc, '04  Platform Features – SportsBox');

  const sbFeatures = [
    ['Court Discovery & Search', '15+ sports, location-based radius filtering, city browsing, multi-sport search.'],
    ['Real-Time Availability', 'Hour-by-hour slot management with capacity enforcement per sport type.'],
    ['Multi-Court Booking', 'Book multiple courts simultaneously for large groups at separate-area facilities.'],
    ['Equipment Rentals', 'Add-on equipment rental (balls, nets, shoes) charged per hour alongside bookings.'],
    ['Booking Cancellation', '2-hour cancellation window with automated refund notifications to customer & vendor.'],
    ['Vendor Analytics Dashboard', 'Revenue per court/city, booking trends, popular sports, customer history.'],
  ];

  let fx = 60;
  let fy = doc.y;
  sbFeatures.forEach(([title, desc], i) => {
    featureCard(doc, fx, fy, title, desc, BRAND_GREEN);
    if (i % 2 === 1) { fy += 92; fx = 60; } else { fx = 320; }
  });

  doc.y = fy + 92;
  doc.moveDown(0.5);

  sectionHeader(doc, '05  Platform Features – Fireflies', BRAND_ORANGE);

  const ffFeatures = [
    ['Event Discovery', 'Browse concerts, sports events, theatre & conferences by city and category.'],
    ['Interactive Seat Maps', 'Visual seat selection with real-time availability and section pricing.'],
    ['Tiered Ticketing', 'VIP, General Admission, and Early Bird tiers with dynamic pricing support.'],
    ['Digital Ticket Verification', 'QR-code based entry verification for event staff at venue gates.'],
    ['Organiser Dashboard', 'Real-time sales tracking, attendance forecasts, and revenue analytics.'],
    ['M-Pesa Ticket Payments', 'All ticket purchases processed via M-Pesa STK Push — no card needed.'],
  ];

  fx = 60;
  fy = doc.y;
  ffFeatures.forEach(([title, desc], i) => {
    featureCard(doc, fx, fy, title, desc, BRAND_ORANGE);
    if (i % 2 === 1) { fy += 92; fx = 60; } else { fx = 320; }
  });

  doc.y = fy + 92;

  // ─── PAGE 5 – USERS & BUSINESS MODEL ────────────────────────────────────
  addPage(doc);

  sectionHeader(doc, '06  Target Users & Benefits');

  const userGroups = [
    {
      title: 'Sports Enthusiasts (Customers)',
      color: BRAND_GREEN,
      points: [
        'Find and book courts in minutes — no calls, no WhatsApp chains',
        'GPS-powered search finds the nearest available court',
        '10% first-booking discount for new sign-ups',
        'Instant M-Pesa payment — money stays on their phone until booking confirmed',
        'Email/SMS confirmations and day-before reminders',
      ],
    },
    {
      title: 'Court Owners & Venue Managers (Vendors)',
      color: BRAND_DARK,
      points: [
        'Digital storefront with photos, pricing, sports, and availability calendar',
        'Revenue dashboard showing earnings per court, sport, and city',
        'Automatic booking notifications with customer details',
        'Peak-hour pricing management to maximise revenue',
        'Multi-court capacity management for large facilities',
      ],
    },
    {
      title: 'Event Organisers',
      color: BRAND_ORANGE,
      points: [
        'Create events with tiered ticket pricing and seat map configuration',
        'Real-time sales analytics and attendee tracking',
        'Digital ticket issuance — no printing costs',
        'Instant M-Pesa payment settlement',
        'QR code scanning for fast, fraud-resistant venue entry',
      ],
    },
  ];

  userGroups.forEach(({ title, color, points }) => {
    doc
      .rect(60, doc.y, 475, 20)
      .fill(color);
    doc
      .fillColor(WHITE)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(title, 72, doc.y - 15, { width: 451 });
    doc.moveDown(0.6);

    points.forEach(p => bulletPoint(doc, p));
    doc.moveDown(0.4);
  });

  // ─── PAGE 6 – BUSINESS MODEL ─────────────────────────────────────────────
  addPage(doc);

  sectionHeader(doc, '07  Business Model & Revenue Streams');

  doc
    .fillColor(TEXT_DARK)
    .font('Helvetica')
    .fontSize(11)
    .text(
      'SportsBox + Fireflies operates on a commission-based marketplace model, keeping the platform free for ' +
      'customers while generating revenue from every transaction processed.',
      { lineGap: 4 }
    );
  doc.moveDown(1);

  const revenueStreams = [
    ['Platform Commission (Primary)', 'A percentage fee on every court booking and event ticket sold through the platform. Vendors receive their earnings minus the platform commission.', BRAND_GREEN],
    ['Vendor Subscription Plans', 'Premium vendor tiers offering advanced analytics, priority listing, promotional features, and increased photo uploads.', BRAND_DARK],
    ['Featured Listings & Promotions', 'Court owners and event organisers can pay to feature their listings at the top of search results for target cities.', BRAND_ORANGE],
    ['Equipment Rental Facilitation', 'Commission on equipment rental bookings added to court reservations.', BRAND_GREEN],
    ['Corporate & Group Bookings', 'Custom pricing packages for corporate sports days, school tournaments, and large group events.', BRAND_DARK],
    ['Data & Analytics Products', 'Aggregated market insights (venue performance, sport trends, city-level demand) sold to venue operators and sports bodies.', BRAND_ORANGE],
  ];

  revenueStreams.forEach(([title, desc, color]) => {
    const startY = doc.y;
    doc.rect(60, startY, 8, 44).fill(color as string);
    doc.fillColor(color as string).font('Helvetica-Bold').fontSize(11).text(title, 76, startY, { width: 457 });
    doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(desc, 76, doc.y, { width: 457, lineGap: 2 });
    doc.moveDown(0.8);
  });

  doc.moveDown(0.5);

  doc
    .rect(60, doc.y, 475, 56)
    .fill(BRAND_LIGHT_GREEN);

  const boxY = doc.y;
  doc
    .fillColor(BRAND_GREEN)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Unit Economics Example', 72, boxY + 8);
  doc
    .fillColor(TEXT_DARK)
    .font('Helvetica')
    .fontSize(10)
    .text(
      'A court booked at KSh 3,000/hr for 2 hours = KSh 6,000 transaction. At 10% commission = KSh 600 platform revenue per booking. ' +
      '100 bookings/day across the platform = KSh 60,000/day → KSh 1.8M/month from bookings alone.',
      72, doc.y - 2, { width: 451, lineGap: 2 }
    );
  doc.y = boxY + 68;

  // ─── PAGE 7 – MARKET OPPORTUNITY ─────────────────────────────────────────
  addPage(doc);

  sectionHeader(doc, '08  Market Opportunity – Kenya');

  const marketPoints = [
    'Kenya has over 52 million people, with 65% under 35 — the primary demographic for sports and entertainment spending.',
    'Nairobi alone has 500+ registered sports facilities with minimal digital presence; most rely on word-of-mouth and WhatsApp bookings.',
    'M-Pesa processes over KSh 500 billion per month in transactions — digital payments are mainstream among our target users.',
    'The East African events market is growing at 12% annually, driven by music festivals, corporate events, and international sports.',
    'Football, basketball, and swimming are the fastest-growing recreational sports in Kenya, with demand outstripping supply of quality courts.',
    'No direct competitor offers a unified sports court + event ticketing platform built specifically for the Kenyan payment and mobile ecosystem.',
  ];

  marketPoints.forEach(p => bulletPoint(doc, p));

  doc.moveDown(1);

  // Market size boxes
  const mboxY = doc.y;
  doc.rect(60, mboxY, 225, 70).fillAndStroke(BRAND_LIGHT_GREEN, BRAND_GREEN);
  doc.fillColor(BRAND_GREEN).font('Helvetica-Bold').fontSize(20).text('KSh 180B+', 60, mboxY + 10, { width: 225, align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text('Total Addressable Market\nKenya Sports & Leisure', 60, mboxY + 40, { width: 225, align: 'center' });

  doc.rect(310, mboxY, 225, 70).fillAndStroke(BRAND_LIGHT_GREEN, BRAND_ORANGE);
  doc.fillColor(BRAND_ORANGE).font('Helvetica-Bold').fontSize(20).text('KSh 45B+', 310, mboxY + 10, { width: 225, align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text('Serviceable Market\nDigitisable Bookings & Tickets', 310, mboxY + 40, { width: 225, align: 'center' });

  doc.y = mboxY + 82;
  doc.moveDown(1);

  sectionHeader(doc, '09  Competitive Advantage', BRAND_DARK);

  const advantages = [
    'M-Pesa native — not bolted on; built from the ground up for Kenyan mobile money infrastructure.',
    'Dual-platform synergy — court owners and event organisers share one vendor dashboard, reducing friction.',
    'GPS-first discovery — location-based search with Haversine distance calculation gives customers the most relevant results.',
    'Kenya-localised — cities, pricing in KSh, Kenyan phone number formats, local sport preferences baked in.',
    'Admin oversight — court approval workflows ensure quality control, protecting the brand and customer experience.',
    'Live & scalable — fully deployed on cloud infrastructure, production M-Pesa integration, ready to scale.',
  ];

  advantages.forEach(a => bulletPoint(doc, a));

  // ─── PAGE 8 – TECHNOLOGY & CTA ───────────────────────────────────────────
  addPage(doc);

  sectionHeader(doc, '10  Technology Stack');

  doc
    .fillColor(TEXT_DARK)
    .font('Helvetica')
    .fontSize(10)
    .text(
      'The platform is built on a modern, production-grade technology stack optimised for performance, scalability, ' +
      'and developer velocity.',
      { lineGap: 4 }
    );
  doc.moveDown(0.8);

  const techStack = [
    ['Frontend', 'React 18 + TypeScript, Vite, Tailwind CSS, Shadcn/ui, TanStack Query, Wouter routing'],
    ['Backend', 'Node.js + Express.js, TypeScript, RESTful API architecture, ESBuild production bundling'],
    ['Database', 'PostgreSQL (Neon serverless), Drizzle ORM with full type safety, schema migrations'],
    ['Authentication', 'Replit Auth (OIDC/OpenID Connect), Passport.js, secure session management'],
    ['Payments', 'M-Pesa Lipa Na M-Pesa (STK Push) — production integration with Safaricom'],
    ['File Storage', 'Google Cloud Storage with presigned URLs for court images and media'],
    ['Notifications', 'Resend email API for booking confirmations, reminders, and vendor alerts'],
    ['Maps & Location', 'Google Maps API, Haversine distance calculations, GPS geolocation'],
    ['Deployment', 'Cloud-hosted, HTTPS, auto-scaling infrastructure — live and accessible 24/7'],
  ];

  techStack.forEach(([category, desc]) => {
    const ty = doc.y;
    doc.rect(60, ty, 110, 24).fill(BRAND_GREEN);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9).text(category, 60, ty + 7, { width: 110, align: 'center' });
    doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(9).text(desc, 178, ty + 7, { width: 357 });
    doc.y = ty + 28;
    doc.moveDown(0.1);
  });

  doc.moveDown(1.2);

  sectionHeader(doc, '11  Current Status & Traction', BRAND_ORANGE);

  const traction = [
    'Fully deployed and live — the platform is accessible to customers and vendors in Kenya today.',
    'Multi-city coverage — Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret supported at launch.',
    'Production M-Pesa integration — real payments processed via Safaricom\'s production API.',
    'End-to-end booking flow — search → book → pay → receive confirmation, fully automated.',
    'Vendor tools live — court listing, photo upload, analytics dashboard, and booking management all operational.',
    'Admin approval system — quality control workflow ensuring only verified courts are listed.',
  ];

  traction.forEach(t => bulletPoint(doc, t));

  doc.moveDown(1);

  // CTA Box
  doc.rect(60, doc.y, 475, 110).fill(BRAND_DARK);
  const ctaY = doc.y;

  doc
    .fillColor(BRAND_GREEN)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('Join Us in Building Kenya\'s Sports & Events Future', 72, ctaY - 96, { width: 451, align: 'center' });

  doc
    .fillColor(WHITE)
    .font('Helvetica')
    .fontSize(10)
    .text(
      'We are seeking investment to accelerate vendor acquisition, expand to additional East African cities, ' +
      'build native iOS & Android mobile apps, and grow our sales and marketing team.',
      72, doc.y + 2, { width: 451, align: 'center', lineGap: 3 }
    );

  doc.moveDown(0.8);

  doc
    .fillColor(BRAND_GREEN)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Get in touch to discuss partnership and investment opportunities:', { align: 'center' });

  doc.moveDown(0.4);

  doc
    .fillColor(WHITE)
    .font('Helvetica')
    .fontSize(11)
    .text('sportsbox.fireflies@kenya.platform', { align: 'center' });

  doc.moveDown(2);

  doc
    .fillColor(GRAY)
    .font('Helvetica')
    .fontSize(8)
    .text(
      'This document is confidential and intended solely for the named recipient. All projections are estimates based on market research. ' +
      '© 2025 SportsBox + Fireflies. All rights reserved.',
      60, doc.y, { width: 475, align: 'center', lineGap: 2 }
    );

  doc.end();
}
