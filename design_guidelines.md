# SportsBox + Fireflies Design Guidelines

## Design Approach

**Reference-Based Strategy**: Drawing from Ticketmaster's event presentation, Airbnb's booking experience, and Linear's modern UI patterns. This dual-platform approach requires sophisticated visual hierarchy to differentiate two brands while maintaining cohesive UX patterns.

## Typography System

**Primary Families**: 
- Display: Inter (700-900 weights) - Headers, navigation, CTAs
- Body: Inter (400-600 weights) - Content, descriptions, forms

**Scale**:
- Hero Headlines: text-5xl to text-7xl (brand differentiation moments)
- Section Headers: text-3xl to text-4xl
- Card Titles: text-xl to text-2xl
- Body Text: text-base to text-lg
- Labels/Meta: text-sm to text-base

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Grid gaps: gap-6 to gap-8
- Container max-widths: max-w-7xl for content areas

**Grid Systems**:
- Court Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Event Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Dual Navigation: Split layout with dedicated zones

## Navigation Architecture

**Dual-Brand Header**:
- Left: Logo switcher component showing both SportsBox + Fireflies brands
- Center: Context-aware navigation (changes based on active platform)
- Right: Search icon, user profile, notifications

**Platform Switcher**:
- Prominent toggle mechanism in header (pill-style segmented control)
- Smooth transition animation between platforms (200ms ease)
- Visual indicator showing active platform

**SportsBox Navigation**: Courts, Locations, My Bookings, Court Finder
**Fireflies Navigation**: Events, Venues, My Tickets, Seat Finder

## Component Library

### Cards - Court Listings
- Aspect ratio 4:3 image with location overlay
- Court name (text-xl font-semibold)
- Location with pin icon, availability status
- Price per hour display (text-2xl font-bold)
- "Book Now" CTA button
- Hover: Subtle shadow elevation, scale-105 transform

### Cards - Event Listings
- Aspect ratio 3:4 poster-style image
- Event title (text-2xl font-bold)
- Venue name, date/time with calendar icon
- Price range display
- Ticket availability badge
- "Get Tickets" CTA button
- Hover: Brightness increase on image

### Search & Filters Panel
- Sticky top position on scroll
- Collapsible filter sections (Location, Date, Price, Amenities for courts / Genre, Venue, Date for events)
- Range sliders for price filtering
- Multi-select checkboxes with counts
- "Apply Filters" and "Clear All" actions
- Mobile: Drawer overlay from bottom

### Interactive Seat Map (Fireflies)
- SVG-based venue layout with zoom/pan controls
- Color-coded seat categories (Available, Selected, Reserved, Premium)
- Click-to-select interaction with instant visual feedback
- Selection summary sidebar (live seat count, total price)
- Mini-map navigation for large venues
- Responsive: Mobile uses vertical scrolling with simplified view

### Booking Calendar (SportsBox)
- Month view with time-slot availability
- Color-coded availability (Available, Partially Booked, Fully Booked)
- Click-to-expand day detail showing hourly slots
- Duration selector (30min, 1hr, 2hr intervals)
- Recurring booking option toggle
- Price preview updates in real-time

### Confirmation Flow
- Step progress indicator (Selection → Details → Payment → Confirmation)
- Summary card always visible (sticky on desktop)
- Form validation with inline error states
- Success state with animated checkmark
- Downloadable ticket/booking confirmation
- Calendar integration options (Google, Apple, Outlook)

### Dashboard Components
- Upcoming bookings/events timeline view
- Quick action cards (Rebook, Cancel, Modify)
- Activity history with filters
- Favorite venues/courts with quick access
- Booking analytics for frequent users

## Page Structures

### SportsBox Homepage
**Hero Section** (h-screen max-h-[600px]): Full-width hero image of sports courts in action, text overlay with gradient backdrop blur, headline "Book Your Perfect Court, Anytime", search bar integration (location + sport + date), blurred-background CTA buttons
**Featured Courts**: 3-column grid of top-rated courts with pricing
**How It Works**: 3-step process cards with icons
**Popular Locations**: Map integration with location markers
**Testimonials**: 2-column carousel layout

### Fireflies Homepage  
**Hero Section** (h-screen max-h-[700px]): Dynamic hero showcasing featured events in diagonal split layout, event imagery with text overlay and backdrop blur, headline "Experience Live Events Like Never Before", category quick links, blurred-background CTAs
**Trending Events**: 4-column masonry grid of event posters
**Browse by Category**: Icon-based category pills (Music, Sports, Theater, Comedy)
**Featured Venues**: Horizontal scroll showcase with venue imagery
**Upcoming This Week**: Timeline-style event listing

### Court Detail Page (SportsBox)
- Image gallery carousel (5-8 professional court photos)
- Court specifications sidebar (surface type, dimensions, amenities)
- Real-time availability calendar
- Reviews section with rating breakdown
- Location map with directions
- Booking sidebar (sticky on scroll)

### Event Detail Page (Fireflies)
- Hero poster image with event details overlay
- Venue information card with capacity and location
- Interactive seat map section
- Artist/performer information (bio, social links)
- Similar events recommendation grid
- Ticket purchase sidebar (sticky on scroll)

## Icons
Use Heroicons via CDN for consistency across both platforms

## Images

**Hero Images**:
- SportsBox: Wide-angle shot of modern indoor courts with dramatic lighting, people mid-action
- Fireflies: Concert/event atmosphere with crowd energy, stage lighting

**Court Listings**: Professional photography of courts showing full facility, consistent lighting
**Event Cards**: Official event posters/promotional imagery, maintain aspect ratios
**Venue Showcases**: Architectural shots highlighting unique venue features
**Category Icons**: Custom illustrated icons for sports types and event genres
**Testimonial Photos**: Circular cropped user photos (80x80px)

## Accessibility

- Focus states: 3px offset ring in brand accent color
- Keyboard navigation for all interactive elements including seat maps
- ARIA labels for platform switcher and complex interactions
- Minimum contrast ratio 4.5:1 for all text
- Skip navigation links for both platforms
- Screen reader announcements for real-time availability updates