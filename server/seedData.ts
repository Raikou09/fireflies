import { db } from './db';
import { users, courts, bookings } from '../shared/schema';
import { nanoid } from 'nanoid';

export async function seedDummyData() {
  try {
    console.log('Starting to seed dummy data...');

    // Create vendor users
    const vendors = await Promise.all([
      db.insert(users).values({
        id: 'vendor-1',
        email: 'john.doe@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'vendor',
        profileImageUrl: null
      }).onConflictDoNothing().returning(),

      db.insert(users).values({
        id: 'vendor-2', 
        email: 'mary.smith@gmail.com',
        firstName: 'Mary',
        lastName: 'Smith',
        userType: 'vendor',
        profileImageUrl: null
      }).onConflictDoNothing().returning(),

      db.insert(users).values({
        id: 'vendor-3',
        email: 'peter.wilson@gmail.com', 
        firstName: 'Peter',
        lastName: 'Wilson',
        userType: 'vendor',
        profileImageUrl: null
      }).onConflictDoNothing().returning()
    ]);

    // Create customer users
    const customers = await Promise.all([
      db.insert(users).values({
        id: 'customer-1',
        email: 'alice@gmail.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        userType: 'customer',
        profileImageUrl: null
      }).onConflictDoNothing().returning(),

      db.insert(users).values({
        id: 'customer-2',
        email: 'bob@gmail.com', 
        firstName: 'Bob',
        lastName: 'Brown',
        userType: 'customer',
        profileImageUrl: null
      }).onConflictDoNothing().returning(),

      db.insert(users).values({
        id: 'customer-3',
        email: 'carol@gmail.com',
        firstName: 'Carol',
        lastName: 'Davis',
        userType: 'customer', 
        profileImageUrl: null
      }).onConflictDoNothing().returning()
    ]);

    // Create courts with approved status
    const sampleCourts = await Promise.all([
      db.insert(courts).values({
        vendorId: 'vendor-1',
        name: 'Westlands Premier Football',
        sport: 'Football',
        city: 'Nairobi',
        area: 'Westlands',
        address: '123 Westlands Road, Nairobi',
        description: 'Professional football pitch with modern facilities',
        hourlyRate: '2500',
        peakHourRate: '3500',
        openingTime: '06:00',
        closingTime: '22:00',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSports: ['Football'],
        approvalStatus: 'approved',
        commissionRate: '15',
        imageUrl: null,
        rules: 'No smoking, proper sports attire required'
      }).onConflictDoNothing().returning(),

      db.insert(courts).values({
        vendorId: 'vendor-2',
        name: 'Karen Tennis Club',
        sport: 'Tennis',
        city: 'Nairobi',
        area: 'Karen',
        address: '456 Karen Road, Nairobi',
        description: 'Premium tennis courts with professional coaching',
        hourlyRate: '1800',
        peakHourRate: '2500',
        openingTime: '06:00',
        closingTime: '21:00',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSports: ['Tennis'],
        approvalStatus: 'approved',
        commissionRate: '15',
        imageUrl: null,
        rules: 'Tennis shoes required, no glass bottles'
      }).onConflictDoNothing().returning(),

      db.insert(courts).values({
        vendorId: 'vendor-3',
        name: 'Kilimani Basketball Arena',
        sport: 'Basketball',
        city: 'Nairobi', 
        area: 'Kilimani',
        address: '789 Kilimani Street, Nairobi',
        description: 'Indoor basketball court with air conditioning',
        hourlyRate: '2200',
        peakHourRate: '3000',
        openingTime: '07:00',
        closingTime: '23:00',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSports: ['Basketball'],
        approvalStatus: 'approved',
        commissionRate: '15',
        imageUrl: null,
        rules: 'Indoor shoes only, maximum 10 players'
      }).onConflictDoNothing().returning(),

      db.insert(courts).values({
        vendorId: 'vendor-1',
        name: 'Parklands Multi-Sport Complex',
        sport: 'Football',
        city: 'Nairobi',
        area: 'Parklands',
        address: '321 Parklands Avenue, Nairobi',
        description: 'Multi-sport facility with football and volleyball',
        hourlyRate: '2800',
        peakHourRate: '4000',
        openingTime: '06:00',
        closingTime: '22:00',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSports: ['Football', 'Volleyball'],
        approvalStatus: 'approved', 
        commissionRate: '18',
        imageUrl: null,
        rules: 'No alcohol, proper equipment required'
      }).onConflictDoNothing().returning()
    ]);

    // Get the created court IDs
    const createdCourtIds = sampleCourts.map(court => court[0]?.id).filter(Boolean);
    
    // Generate bookings over the last 4 months
    const bookingData = [];
    const customerIds = ['customer-1', 'customer-2', 'customer-3'];
    const statuses = ['confirmed', 'completed', 'cancelled'];
    const sports = ['Football', 'Tennis', 'Basketball'];
    
    // Create bookings for the last 4 months
    for (let monthOffset = 0; monthOffset < 4; monthOffset++) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthOffset);
      startDate.setDate(1);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      
      // Generate 15-25 bookings per month per court
      for (const courtId of createdCourtIds) {
        const bookingsPerMonth = Math.floor(Math.random() * 10) + 15; // 15-25 bookings
        
        for (let i = 0; i < bookingsPerMonth; i++) {
          const bookingDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
          const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const selectedSport = sports[Math.floor(Math.random() * sports.length)];
          
          // Different pricing based on random amounts
          const baseAmounts = [1800, 2200, 2500, 2800];
          const amount = baseAmounts[Math.floor(Math.random() * baseAmounts.length)];
          const isPeak = Math.random() < 0.3;
          const finalAmount = isPeak ? Math.round(amount * 1.4) : amount;

          bookingData.push({
            courtId,
            customerId,
            selectedSport,
            bookingDate: bookingDate.toISOString().split('T')[0],
            timeSlot: '09:00-10:00',
            duration: 1,
            totalAmount: finalAmount,
            amount: finalAmount,
            customerPhone: '+254700000000',
            customerName: 'Sample Customer',
            status: status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
            paymentStatus: status === 'cancelled' ? 'failed' : 'completed',
            createdAt: bookingDate,
            updatedAt: bookingDate
          });
        }
      }
    }

    // Insert bookings in batches
    const batchSize = 50;
    for (let i = 0; i < bookingData.length; i += batchSize) {
      const batch = bookingData.slice(i, i + batchSize);
      await db.insert(bookings).values(batch).onConflictDoNothing();
    }

    console.log(`Successfully seeded dummy data:`);
    console.log(`- ${vendors.length} vendor users`);
    console.log(`- ${customers.length} customer users`);
    console.log(`- ${sampleCourts.length} courts`);
    console.log(`- ${bookingData.length} bookings`);

    return {
      vendors: vendors.length,
      customers: customers.length,
      courts: sampleCourts.length,
      bookings: bookingData.length
    };

  } catch (error) {
    console.error('Error seeding dummy data:', error);
    throw error;
  }
}