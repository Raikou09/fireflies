import type { InsertSeat, InsertSeatSection } from './schema';

export interface TemplateSeat extends Omit<InsertSeat, 'id' | 'venueId' | 'sectionId' | 'createdAt' | 'updatedAt'> {
  sectionName: string; // Reference to section name for mapping
}

export interface VenueTemplate {
  id: string;
  name: string;
  description: string;
  category: 'cricket' | 'football' | 'basketball' | 'theatre' | 'concert';
  capacity: number;
  sections: Omit<InsertSeatSection, 'id' | 'venueId'>[];
  seats: TemplateSeat[];
}

export const VENUE_TEMPLATES: VenueTemplate[] = [
  {
    id: 'cricket-stadium',
    name: 'Cricket Stadium',
    description: 'Oval-shaped stadium with pavilion, grandstand, and general seating sections',
    category: 'cricket',
    capacity: 15000,
    sections: [
      { name: 'Pavilion', color: '#FFD700', basePrice: '5000' },
      { name: 'Grandstand', color: '#FF6B6B', basePrice: '3000' },
      { name: 'General Stand', color: '#4ECDC4', basePrice: '1500' },
      { name: 'Boundary Seating', color: '#95E1D3', basePrice: '2500' },
    ],
    seats: generateCricketStadiumSeats(),
  },
  {
    id: 'football-stadium',
    name: 'Football Stadium',
    description: 'Rectangular stadium with sideline, endzone, and VIP sections',
    category: 'football',
    capacity: 20000,
    sections: [
      { name: 'VIP Box', color: '#FFD700', basePrice: '6000' },
      { name: 'Lower Sideline', color: '#FF6B6B', basePrice: '4000' },
      { name: 'Upper Sideline', color: '#4ECDC4', basePrice: '2500' },
      { name: 'End Zone', color: '#95E1D3', basePrice: '1800' },
      { name: 'Corner Sections', color: '#A8DADC', basePrice: '2000' },
    ],
    seats: generateFootballStadiumSeats(),
  },
  {
    id: 'basketball-arena',
    name: 'Basketball Arena',
    description: 'Indoor arena with courtside, lower bowl, and upper bowl sections',
    category: 'basketball',
    capacity: 8000,
    sections: [
      { name: 'Courtside', color: '#FFD700', basePrice: '8000' },
      { name: 'Lower Bowl', color: '#FF6B6B', basePrice: '4500' },
      { name: 'Club Seats', color: '#FFA500', basePrice: '5500' },
      { name: 'Upper Bowl', color: '#4ECDC4', basePrice: '2000' },
    ],
    seats: generateBasketballArenaSeats(),
  },
  {
    id: 'movie-theatre',
    name: 'Movie Theatre',
    description: 'Traditional cinema with standard, premium, and back row sections',
    category: 'theatre',
    capacity: 300,
    sections: [
      { name: 'Premium Seats', color: '#FFD700', basePrice: '800' },
      { name: 'Standard Seats', color: '#4ECDC4', basePrice: '500' },
      { name: 'Back Row', color: '#95E1D3', basePrice: '400' },
    ],
    seats: generateMovieTheatreSeats(),
  },
  {
    id: 'concert-hall',
    name: 'Concert Hall',
    description: 'Concert venue with pit, floor, balcony, and VIP sections',
    category: 'concert',
    capacity: 5000,
    sections: [
      { name: 'VIP Lounge', color: '#FFD700', basePrice: '10000' },
      { name: 'Front Pit', color: '#FF6B6B', basePrice: '7000' },
      { name: 'Floor Seating', color: '#FFA500', basePrice: '4500' },
      { name: 'Balcony', color: '#4ECDC4', basePrice: '3000' },
      { name: 'General Admission', color: '#95E1D3', basePrice: '2000' },
    ],
    seats: generateConcertHallSeats(),
  },
];

// Helper functions to generate seat layouts

function generateCricketStadiumSeats(): TemplateSeat[] {
  const seats: TemplateSeat[] = [];
  
  // Pavilion - 2000 seats (40 rows x 50 seats)
  let y = 0;
  for (let row = 1; row <= 40; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats.push({
        seatLabel: `P${row}-${seat}`,
        row: `P${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 35,
        sectionName: 'Pavilion',
      });
    }
  }
  
  // Grandstand - 4000 seats (50 rows x 80 seats)
  y += 40;
  for (let row = 1; row <= 50; row++) {
    for (let seat = 1; seat <= 80; seat++) {
      seats.push({
        seatLabel: `G${row}-${seat}`,
        row: `G${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 45,
        sectionName: 'Grandstand',
      });
    }
  }
  
  // General Stand - 6000 seats (60 rows x 100 seats)
  y += 50;
  for (let row = 1; row <= 60; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats.push({
        seatLabel: `GS${row}-${seat}`,
        row: `GS${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 55,
        sectionName: 'General Stand',
      });
    }
  }
  
  // Boundary Seating - 3000 seats (30 rows x 100 seats)
  y += 60;
  for (let row = 1; row <= 30; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats.push({
        seatLabel: `B${row}-${seat}`,
        row: `B${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 25,
        sectionName: 'Boundary Seating',
      });
    }
  }
  
  return seats;
}

function generateFootballStadiumSeats(): TemplateSeat[] {
  const seats: TemplateSeat[] = [];
  
  // VIP Box - 500 seats (10 rows x 50 seats)
  let y = 0;
  for (let row = 1; row <= 10; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats.push({
        seatLabel: `VIP${row}-${seat}`,
        row: `VIP${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 8,
        sectionName: 'VIP Box',
      });
    }
  }
  
  // Lower Sideline - 6000 seats (40 rows x 150 seats)
  y += 10;
  for (let row = 1; row <= 40; row++) {
    for (let seat = 1; seat <= 150; seat++) {
      seats.push({
        seatLabel: `LS${row}-${seat}`,
        row: `LS${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 35,
        sectionName: 'Lower Sideline',
      });
    }
  }
  
  // Upper Sideline - 8000 seats (50 rows x 160 seats)
  y += 40;
  for (let row = 1; row <= 50; row++) {
    for (let seat = 1; seat <= 160; seat++) {
      seats.push({
        seatLabel: `US${row}-${seat}`,
        row: `US${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 45,
        sectionName: 'Upper Sideline',
      });
    }
  }
  
  // End Zone - 4000 seats (40 rows x 100 seats)
  y += 50;
  for (let row = 1; row <= 40; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats.push({
        seatLabel: `EZ${row}-${seat}`,
        row: `EZ${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 35,
        sectionName: 'End Zone',
      });
    }
  }
  
  // Corner Sections - 1500 seats (30 rows x 50 seats)
  y += 40;
  for (let row = 1; row <= 30; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats.push({
        seatLabel: `C${row}-${seat}`,
        row: `C${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 25,
        sectionName: 'Corner Sections',
      });
    }
  }
  
  return seats;
}

function generateBasketballArenaSeats(): TemplateSeat[] {
  const seats: TemplateSeat[] = [];
  
  // Courtside - 200 seats (4 rows x 50 seats)
  let y = 0;
  for (let row = 1; row <= 4; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats.push({
        seatLabel: `CS${row}-${seat}`,
        row: `CS${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: true,
        sectionName: 'Courtside',
      });
    }
  }
  
  // Lower Bowl - 3000 seats (30 rows x 100 seats)
  y += 4;
  for (let row = 1; row <= 30; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats.push({
        seatLabel: `LB${row}-${seat}`,
        row: `LB${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 25,
        sectionName: 'Lower Bowl',
      });
    }
  }
  
  // Club Seats - 800 seats (10 rows x 80 seats)
  y += 30;
  for (let row = 1; row <= 10; row++) {
    for (let seat = 1; seat <= 80; seat++) {
      seats.push({
        seatLabel: `CL${row}-${seat}`,
        row: `CL${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 8,
        sectionName: 'Club Seats',
      });
    }
  }
  
  // Upper Bowl - 4000 seats (40 rows x 100 seats)
  y += 10;
  for (let row = 1; row <= 40; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats.push({
        seatLabel: `UB${row}-${seat}`,
        row: `UB${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 35,
        sectionName: 'Upper Bowl',
      });
    }
  }
  
  return seats;
}

function generateMovieTheatreSeats(): TemplateSeat[] {
  const seats: TemplateSeat[] = [];
  
  // Premium Seats - 50 seats (5 rows x 10 seats)
  for (let row = 1; row <= 5; row++) {
    for (let seat = 1; seat <= 10; seat++) {
      seats.push({
        seatLabel: `${String.fromCharCode(64 + row)}${seat}`,
        row: String.fromCharCode(64 + row),
        number: seat,
        x: seat,
        y: row,
        priceOverride: null,
        isAccessible: row === 5,
        sectionName: 'Premium Seats',
      });
    }
  }
  
  // Standard Seats - 200 seats (20 rows x 10 seats)
  for (let row = 6; row <= 25; row++) {
    for (let seat = 1; seat <= 10; seat++) {
      seats.push({
        seatLabel: `${String.fromCharCode(64 + row)}${seat}`,
        row: String.fromCharCode(64 + row),
        number: seat,
        x: seat,
        y: row,
        priceOverride: null,
        isAccessible: row === 15 || row === 25,
        sectionName: 'Standard Seats',
      });
    }
  }
  
  // Back Row - 50 seats (5 rows x 10 seats)
  for (let row = 26; row <= 30; row++) {
    for (let seat = 1; seat <= 10; seat++) {
      seats.push({
        seatLabel: `${String.fromCharCode(64 + row)}${seat}`,
        row: String.fromCharCode(64 + row),
        number: seat,
        x: seat,
        y: row,
        priceOverride: null,
        isAccessible: row === 30,
        sectionName: 'Back Row',
      });
    }
  }
  
  return seats;
}

function generateConcertHallSeats(): TemplateSeat[] {
  const seats: TemplateSeat[] = [];
  
  // VIP Lounge - 100 seats (5 rows x 20 seats)
  let y = 0;
  for (let row = 1; row <= 5; row++) {
    for (let seat = 1; seat <= 20; seat++) {
      seats.push({
        seatLabel: `VIP${row}-${seat}`,
        row: `VIP${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: true,
        sectionName: 'VIP Lounge',
      });
    }
  }
  
  // Front Pit - 500 seats (10 rows x 50 seats)
  y += 5;
  for (let row = 1; row <= 10; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats.push({
        seatLabel: `PIT${row}-${seat}`,
        row: `PIT${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 8,
        sectionName: 'Front Pit',
      });
    }
  }
  
  // Floor Seating - 1500 seats (20 rows x 75 seats)
  y += 10;
  for (let row = 1; row <= 20; row++) {
    for (let seat = 1; seat <= 75; seat++) {
      seats.push({
        seatLabel: `FL${row}-${seat}`,
        row: `FL${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 18,
        sectionName: 'Floor Seating',
      });
    }
  }
  
  // Balcony - 1200 seats (15 rows x 80 seats)
  y += 20;
  for (let row = 1; row <= 15; row++) {
    for (let seat = 1; seat <= 80; seat++) {
      seats.push({
        seatLabel: `BAL${row}-${seat}`,
        row: `BAL${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 13,
        sectionName: 'Balcony',
      });
    }
  }
  
  // General Admission - 1700 seats (20 rows x 85 seats)
  y += 15;
  for (let row = 1; row <= 20; row++) {
    for (let seat = 1; seat <= 85; seat++) {
      seats.push({
        seatLabel: `GA${row}-${seat}`,
        row: `GA${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 18,
        sectionName: 'General Admission',
      });
    }
  }
  
  return seats;
}

export function getTemplateById(templateId: string): VenueTemplate | undefined {
  return VENUE_TEMPLATES.find(t => t.id === templateId);
}

export function getTemplatesByCategory(category: string): VenueTemplate[] {
  return VENUE_TEMPLATES.filter(t => t.category === category);
}
