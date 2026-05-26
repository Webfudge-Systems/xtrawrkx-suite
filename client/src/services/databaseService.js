import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    getCountFromServer
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper function to safely convert Firestore timestamps to Date objects
const convertFirestoreTimestampToDate = (timestamp) => {
    if (!timestamp) {
        return null;
    }

    // If it's already a Date object, return it
    if (timestamp instanceof Date) {
        return timestamp;
    }

    // If it's a Firestore Timestamp with toDate method
    if (timestamp && typeof timestamp.toDate === 'function') {
        try {
            return timestamp.toDate();
        } catch (error) {
            return null;
        }
    }

    // If it's a string, try to parse it as a date
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
    }

    // If it's a number (Unix timestamp), convert it
    if (typeof timestamp === 'number') {
        return new Date(timestamp);
    }

    // If it has seconds and nanoseconds (Firestore Timestamp-like object)
    if (timestamp && timestamp.seconds !== undefined) {
        return new Date(timestamp.seconds * 1000);
    }

    return null;
};

// Base Database Service
class BaseDatabaseService {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    // Create a new document
    async create(data) {
        try {
            // Check if Firebase is available
            if (!db) {
                throw new Error('Firebase database is not initialized');
            }

            const docData = {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };


            const docRef = await addDoc(collection(db, this.collectionName), docData);

            const result = {
                id: docRef.id,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            };


            return result;
        } catch (error) {
            // Provide more specific error messages
            if (error.code === 'permission-denied') {
                throw new Error(`Permission denied. Check Firebase security rules for ${this.collectionName}`);
            } else if (error.code === 'unavailable') {
                throw new Error(`Firebase service is temporarily unavailable. Please try again later.`);
            } else if (error.message.includes('Firebase database is not initialized')) {
                throw new Error(`Database connection error. Please check Firebase configuration.`);
            } else {
                throw new Error(`Failed to create ${this.collectionName.slice(0, -1)}: ${error.message}`);
            }
        }
    }

    // Get all documents
    async getAll(orderField = 'createdAt', orderDirection = 'desc') {
        try {
            // Check if Firebase is available
            if (!db) {
                return [];
            }

            // First try to get all documents with ordering
            let querySnapshot;
            let needsInMemorySort = false;
            try {
                const q = query(
                    collection(db, this.collectionName),
                    orderBy(orderField, orderDirection)
                );
                querySnapshot = await getDocs(q);
            } catch (orderError) {
                // Fallback: get all documents without ordering
                querySnapshot = await getDocs(collection(db, this.collectionName));
                needsInMemorySort = true;
            }

            const results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                date: convertFirestoreTimestampToDate(doc.data().date),
                registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
            }));

            // If we had to fall back to no ordering, sort in memory
            if (needsInMemorySort && orderField && results.length > 0) {
                results.sort((a, b) => {
                    let aValue = a[orderField];
                    let bValue = b[orderField];

                    // Handle different data types
                    if (aValue instanceof Date && bValue instanceof Date) {
                        // Date comparison
                        aValue = aValue.getTime();
                        bValue = bValue.getTime();
                    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                        // String comparison (case insensitive)
                        aValue = aValue.toLowerCase();
                        bValue = bValue.toLowerCase();
                    }

                    if (orderDirection === 'asc') {
                        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                    } else {
                        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                    }
                });
            }


            return results;
        } catch (error) {
            throw new Error(`Failed to fetch ${this.collectionName}: ${error.message}`);
        }
    }

    // Get document by ID
    async getById(id) {
        try {
            const docRef = doc(db, this.collectionName, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: convertFirestoreTimestampToDate(docSnap.data().createdAt),
                    updatedAt: convertFirestoreTimestampToDate(docSnap.data().updatedAt),
                    date: convertFirestoreTimestampToDate(docSnap.data().date),
                    registrationDeadline: convertFirestoreTimestampToDate(docSnap.data().registrationDeadline)
                };
            } else {
                return null;
            }
        } catch (error) {
            throw new Error(`Failed to fetch ${this.collectionName.slice(0, -1)}: ${error.message}`);
        }
    }

    // Update document
    async update(id, data) {
        try {
            const docRef = doc(db, this.collectionName, id);
            const updateData = {
                ...data,
                updatedAt: serverTimestamp()
            };
            await updateDoc(docRef, updateData);
            return {
                id,
                ...data,
                updatedAt: new Date()
            };
        } catch (error) {
            throw new Error(`Failed to update ${this.collectionName.slice(0, -1)}: ${error.message}`);
        }
    }

    // Delete a document
    async delete(id) {
        try {
            if (!id) {
                throw new Error('Document ID is required for deletion');
            }

            const docRef = doc(db, this.collectionName, id);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }

    // Get documents by field
    async getByField(field, value, orderField = 'createdAt', orderDirection = 'desc') {
        try {
            // First try with ordering (requires composite index if orderField != field)
            let querySnapshot;
            try {
                const q = query(
                    collection(db, this.collectionName),
                    where(field, '==', value),
                    orderBy(orderField, orderDirection)
                );
                querySnapshot = await getDocs(q);
            } catch (orderError) {
                // Fallback: query without ordering
                const q = query(
                    collection(db, this.collectionName),
                    where(field, '==', value)
                );
                querySnapshot = await getDocs(q);
            }

            const results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                date: convertFirestoreTimestampToDate(doc.data().date),
                registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
            }));

            // If we had to fall back to no ordering, sort in memory
            if (orderField && results.length > 0) {
                results.sort((a, b) => {
                    let aValue = a[orderField];
                    let bValue = b[orderField];

                    // Handle different data types
                    if (aValue instanceof Date && bValue instanceof Date) {
                        // Date comparison
                        aValue = aValue.getTime();
                        bValue = bValue.getTime();
                    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                        // String comparison (case insensitive)
                        aValue = aValue.toLowerCase();
                        bValue = bValue.toLowerCase();
                    }

                    if (orderDirection === 'asc') {
                        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                    } else {
                        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                    }
                });
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to fetch ${this.collectionName}: ${error.message}`);
        }
    }

    // Get count of documents
    async getCount() {
        try {
            // Check if Firebase is available
            if (!db) {
                return 0;
            }

            const snapshot = await getCountFromServer(collection(db, this.collectionName));
            return snapshot.data().count;
        } catch (error) {

            // If count fails, try to get all documents and count them manually
            try {
                const allDocs = await this.getAll();
                return allDocs.length;
            } catch (fallbackError) {
                return 0;
            }
        }
    }

    // Get documents with limit
    async getWithLimit(limitCount = 10, orderField = 'createdAt', orderDirection = 'desc') {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy(orderField, orderDirection),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                date: convertFirestoreTimestampToDate(doc.data().date),
                registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
            }));
        } catch (error) {
            throw new Error(`Failed to fetch ${this.collectionName}: ${error.message}`);
        }
    }
}

// Event Service
export class EventService extends BaseDatabaseService {
    constructor() {
        super('events');
    }

    // Create event
    async createEvent(eventData) {
        return this.create(eventData);
    }

    // Get all events
    async getEvents() {
        return this.getAll('date', 'desc');
    }

    // Get event by slug
    async getEventBySlug(slug) {
        try {

            const q = query(
                collection(db, this.collectionName),
                where('slug', '==', slug)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const result = {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                    updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                    date: convertFirestoreTimestampToDate(doc.data().date),
                    registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
                };

                return result;
            }

            return null;
        } catch (error) {
            throw new Error(`Failed to fetch event: ${error.message}`);
        }
    }

    // Get upcoming events
    async getUpcomingEvents() {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('status', '==', 'upcoming'),
                orderBy('date', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                date: convertFirestoreTimestampToDate(doc.data().date),
                registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
            })).filter((event) => {
                return event.status && event.status.toLowerCase() === "upcoming";
            });
        } catch (error) {
            throw new Error(`Failed to fetch upcoming events: ${error.message}`);
        }
    }

    // Get past events
    async getPastEvents() {
        try {
            // Set to start of today to exclude today's events
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today


            const q = query(
                collection(db, this.collectionName),
                where('date', '<', today),
                orderBy('date', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const pastEvents = querySnapshot.docs.map(doc => {
                const eventData = {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                    updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                    date: convertFirestoreTimestampToDate(doc.data().date),
                    registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
                };

                return eventData;
            });

            return pastEvents;
        } catch (error) {
            throw new Error(`Failed to fetch past events: ${error.message}`);
        }
    }

    // Update event status
    async updateEventStatus(id, status) {
        return this.update(id, { status });
    }

    // Get events by category
    async getEventsByCategory(category) {
        return this.getByField('category', category, 'date', 'desc');
    }

    // Get featured events
    async getFeaturedEvents() {
        return this.getByField('featured', true, 'date', 'desc');
    }

    // Get events by season
    async getEventsBySeason(season) {
        try {


            // Use the most basic query possible - just filter by season
            const q = query(
                collection(db, this.collectionName),
                where('season', '==', season)
            );
            const querySnapshot = await getDocs(q);

            const events = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                date: convertFirestoreTimestampToDate(doc.data().date),
                registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
            }));

            // Sort by date in JavaScript to avoid index issues
            events.sort((a, b) => {
                const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
                const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
                return dateA - dateB; // ascending order
            });


            return events;
        } catch (error) {
            // Fallback: get all events and filter in JavaScript
            try {

                const allEvents = await this.getAll();
                const seasonEvents = allEvents.filter(event => event.season === season);

                return seasonEvents;
            } catch (fallbackError) {
                throw new Error(`Failed to fetch events for season ${season}: ${error.message}`);
            }
        }
    }

    // Get upcoming events by season
    async getUpcomingEventsBySeason(season) {
        try {


            // Get all events for the season first
            const seasonEvents = await this.getEventsBySeason(season);

            // Filter for upcoming events in JavaScript
            const upcomingEvents = seasonEvents.filter(event =>
                event.status && event.status.toLowerCase() === 'upcoming'
            );


            return upcomingEvents;
        } catch (error) {
            throw new Error(`Failed to fetch upcoming events for season ${season}: ${error.message}`);
        }
    }


}

// Resource Service
export class ResourceService extends BaseDatabaseService {
    constructor() {
        super('resources');
    }

    // Create resource
    async createResource(resourceData) {
        return this.create(resourceData);
    }

    // Get all resources
    async getResources() {
        return this.getAll('publishedDate', 'desc');
    }

    // Get resource by slug
    async getResourceBySlug(slug) {
        const resources = await this.getByField('slug', slug);
        return resources.length > 0 ? resources[0] : null;
    }

    // Get resources by type
    async getResourcesByType(type) {
        return this.getByField('type', type, 'publishedDate', 'desc');
    }

    // Get resources by category
    async getResourcesByCategory(category) {
        return this.getByField('category', category, 'publishedDate', 'desc');
    }

    // Get featured resources
    async getFeaturedResources() {
        return this.getByField('featured', true, 'publishedDate', 'desc');
    }
}

// Service Service (for business services)
export class ServiceService extends BaseDatabaseService {
    constructor() {
        super('services');
    }

    // Create service
    async createService(serviceData) {
        return this.create(serviceData);
    }

    // Get all services
    async getServices() {
        return this.getAll('name', 'asc');
    }

    // Get service by slug
    async getServiceBySlug(slug) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('slug', '==', slug)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                    updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                    date: convertFirestoreTimestampToDate(doc.data().date),
                    registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
                };
            }
            return null;
        } catch (error) {
            throw new Error(`Failed to fetch service: ${error.message}`);
        }
    }

    // Get services by category
    async getServicesByCategory(category) {
        return this.getByField('category', category, 'name', 'asc');
    }

    // Get services by sub-company
    async getServicesBySubCompany(subCompany) {
        return this.getByField('subCompany', subCompany, 'name', 'asc');
    }

    // Get featured services
    async getFeaturedServices() {
        return this.getByField('featured', true, 'name', 'asc');
    }
}

// Gallery Service
export class GalleryService extends BaseDatabaseService {
    constructor() {
        super('gallery');
    }

    // Create gallery item
    async createGalleryItem(galleryData) {
        return this.create(galleryData);
    }

    // Get all gallery items
    async getGalleryItems() {
        return this.getAll('date', 'desc');
    }

    // Get gallery item by ID
    async getGalleryItemById(id) {
        return this.getById(id);
    }

    // Get gallery items by category
    async getGalleryItemsByCategory(category) {
        return this.getByField('category', category, 'date', 'desc');
    }

    // Get featured gallery items
    async getFeaturedGalleryItems() {
        return this.getByField('featured', true, 'date', 'desc');
    }

    // Update gallery item
    async updateGalleryItem(id, updateData) {
        return this.update(id, updateData);
    }

    // Delete gallery item
    async deleteGalleryItem(id) {
        return this.delete(id);
    }

    // Get gallery items by event
    async getGalleryItemsByEvent(eventId) {
        return this.getByField('eventId', eventId, 'date', 'desc');
    }

    // Get gallery items by event slug
    async getGalleryItemsByEventSlug(eventSlug) {
        try {
            // First get the event by slug to get its ID
            const eventService = new EventService();
            const event = await eventService.getEventBySlug(eventSlug);
            if (!event) {
                return [];
            }
            return this.getGalleryItemsByEvent(event.id);
        } catch (error) {
            throw error;
        }
    }

    // Search gallery items
    async searchGalleryItems(searchTerm) {
        try {
            const allItems = await this.getGalleryItems();
            return allItems.filter(item =>
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        } catch (error) {
            throw error;
        }
    }
}

// Contact Inquiry Service  
export class ContactService extends BaseDatabaseService {
    constructor() {
        super('contact_inquiries');
    }

    // Create contact inquiry
    async createInquiry(inquiryData) {
        return this.create(inquiryData);
    }

    // Get all inquiries
    async getInquiries() {
        return this.getAll('createdAt', 'desc');
    }

    // Get inquiry by ID
    async getInquiryById(id) {
        return this.getById(id);
    }

    // Get inquiries by type
    async getInquiriesByType(inquiryType) {
        return this.getByField('inquiryType', inquiryType, 'createdAt', 'desc');
    }

    // Get inquiries by priority
    async getInquiriesByPriority(priority) {
        return this.getByField('priority', priority, 'createdAt', 'desc');
    }

    // Update inquiry status
    async updateInquiryStatus(id, status) {
        return this.update(id, { status, statusUpdatedAt: new Date() });
    }

    // Mark inquiry as resolved
    async markInquiryResolved(id, resolvedBy = null) {
        return this.update(id, {
            status: 'resolved',
            resolvedAt: new Date(),
            resolvedBy
        });
    }

    // Get limited number of inquiries
    async getWithLimit(limitCount, orderField = 'createdAt', orderDirection = 'desc') {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy(orderField, orderDirection),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt)
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get count of inquiries
    async getCount() {
        try {
            const snapshot = await getCountFromServer(collection(db, this.collectionName));
            return snapshot.data().count;
        } catch (error) {
            return 0;
        }
    }
}

// Booking/Consultation Service
export class BookingService extends BaseDatabaseService {
    constructor() {
        super('consultation_bookings');
    }

    // Create booking
    async createBooking(bookingData) {
        return this.create(bookingData);
    }

    // Get all bookings
    async getBookings() {
        return this.getAll('preferredDate', 'asc');
    }

    // Get booking by ID
    async getBookingById(id) {
        return this.getById(id);
    }

    // Get bookings by consultation type
    async getBookingsByType(consultationType) {
        return this.getByField('consultationType', consultationType, 'preferredDate', 'asc');
    }

    // Get bookings by status
    async getBookingsByStatus(status) {
        return this.getByField('status', status, 'preferredDate', 'asc');
    }

    // Update booking status
    async updateBookingStatus(id, status) {
        return this.update(id, { status, statusUpdatedAt: new Date() });
    }

    // Confirm booking
    async confirmBooking(id, confirmedBy = null, meetingDetails = {}) {
        return this.update(id, {
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy,
            meetingDetails
        });
    }

    // Get upcoming bookings
    async getUpcomingBookings() {
        try {
            const allBookings = await this.getBookings();
            const today = new Date();
            return allBookings.filter(booking => {
                const bookingDate = new Date(booking.preferredDate);
                return bookingDate >= today && booking.status === 'confirmed';
            });
        } catch (error) {
            throw error;
        }
    }

    // Get limited number of bookings
    async getWithLimit(limitCount, orderField = 'createdAt', orderDirection = 'desc') {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy(orderField, orderDirection),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt)
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get count of bookings
    async getCount() {
        try {
            const snapshot = await getCountFromServer(collection(db, this.collectionName));
            return snapshot.data().count;
        } catch (error) {
            return 0;
        }
    }
}

// Event Registration Service
export class EventRegistrationService extends BaseDatabaseService {
    constructor() {
        super('event_registrations');
    }

    // Create registration
    async createRegistration(registrationData) {
        return this.create(registrationData);
    }

    // Get all registrations
    async getRegistrations() {
        return this.getAll('createdAt', 'desc');
    }

    // Get registrations by event ID
    async getRegistrationsByEventId(eventId) {
        return this.getByField('eventId', eventId, 'createdAt', 'desc');
    }

    // Get registration by email and event ID
    async getRegistrationByEmailAndEvent(email, eventId) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('email', '==', email),
                where('eventId', '==', eventId)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                    updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt),
                    date: convertFirestoreTimestampToDate(doc.data().date),
                    registrationDeadline: convertFirestoreTimestampToDate(doc.data().registrationDeadline)
                };
            }
            return null;
        } catch (error) {
            throw new Error(`Failed to fetch registration: ${error.message}`);
        }
    }

    // Update registration status
    async updateRegistrationStatus(id, status) {
        return this.update(id, { status });
    }

    // Create season registration
    async createSeasonRegistration(registrationData) {
        return this.create(registrationData);
    }

    // Get registrations by season
    async getRegistrationsBySeason(season) {
        return this.getByField('season', season, 'createdAt', 'desc');
    }

    // Get registration by company email and season
    async getRegistrationByCompanyAndSeason(companyEmail, season) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('companyEmail', '==', companyEmail),
                where('season', '==', season)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: convertFirestoreTimestampToDate(doc.data().createdAt),
                    updatedAt: convertFirestoreTimestampToDate(doc.data().updatedAt)
                };
            }
            return null;
        } catch (error) {
            throw new Error(`Failed to fetch registration: ${error.message}`);
        }
    }

    // Update season registration (MISSING METHOD - CRITICAL FIX)
    async updateSeasonRegistration(id, updateData) {
        try {
            // Add validation for required fields
            if (!id) {
                throw new Error('Registration ID is required');
            }

            const result = await this.update(id, updateData);
            return result;
        } catch (error) {
            throw new Error(`Failed to update season registration: ${error.message}`);
        }
    }

    // Update regular registration with better error handling
    async updateRegistration(id, updateData) {
        try {
            // Add validation for required fields
            if (!id) {
                throw new Error('Registration ID is required');
            }

            const result = await this.update(id, updateData);
            return result;
        } catch (error) {
            throw new Error(`Failed to update registration: ${error.message}`);
        }
    }

    // Create a failed payment log for manual resolution
    async createFailedPaymentLog(paymentData) {
        try {
            const failedPaymentData = {
                ...paymentData,
                status: 'payment_completed_update_failed',
                needsManualReview: true,
                loggedAt: new Date().toISOString(),
                resolved: false
            };

            // Store in a separate collection for admin review
            const failedPaymentService = new BaseDatabaseService('failed_payment_logs');
            const result = await failedPaymentService.create(failedPaymentData);
            return result;
        } catch (error) {
            // Don't throw here as this is a fallback mechanism
            return null;
        }
    }
}

// Team Service
export class TeamService extends BaseDatabaseService {
    constructor() {
        super('team');
    }

    // Create a new team member
    async createTeamMember(memberData) {
        try {


            const docData = {
                ...memberData,
                isActive: memberData.isActive ?? true,
                joinDate: memberData.joinDate || new Date().toISOString().split('T')[0],
            };

            return await this.create(docData);
        } catch (error) {
            throw new Error(`Failed to create team member: ${error.message}`);
        }
    }

    // Get all team members
    async getAllTeamMembers() {
        try {


            const members = await this.getAll('name', 'asc');

            return members.map(member => ({
                ...member,
                joinDate: member.joinDate || new Date().toISOString().split('T')[0],
                isActive: member.isActive ?? true
            }));
        } catch (error) {
            // Try without ordering as fallback
            try {
                const members = await this.getAll();
                return members.map(member => ({
                    ...member,
                    joinDate: member.joinDate || new Date().toISOString().split('T')[0],
                    isActive: member.isActive ?? true
                }));
            } catch (fallbackError) {
                throw new Error(`Failed to fetch team members: ${fallbackError.message}`);
            }
        }
    }

    // Get team members by category
    async getTeamMembersByCategory(category) {
        try {


            const members = await this.getByField('category', category, 'name', 'asc');

            return members.map(member => ({
                ...member,
                joinDate: member.joinDate || new Date().toISOString().split('T')[0],
                isActive: member.isActive ?? true
            }));
        } catch (error) {
            // Try without ordering as fallback
            try {
                const members = await this.getByField('category', category);
                return members.map(member => ({
                    ...member,
                    joinDate: member.joinDate || new Date().toISOString().split('T')[0],
                    isActive: member.isActive ?? true
                }));
            } catch (fallbackError) {
                throw new Error(`Failed to fetch ${category} team members: ${fallbackError.message}`);
            }
        }
    }

    // Get active team members
    async getActiveTeamMembers() {
        try {
            const members = await this.getByField('isActive', true);

            return members.map(member => ({
                ...member,
                joinDate: member.joinDate || new Date().toISOString().split('T')[0]
            }));
        } catch (error) {
            throw new Error(`Failed to fetch active team members: ${error.message}`);
        }
    }

    // Get team member by ID
    async getTeamMemberById(id) {
        try {
            const member = await this.getById(id);

            if (member) {
                return {
                    ...member,
                    joinDate: member.joinDate || new Date().toISOString().split('T')[0],
                    isActive: member.isActive ?? true
                };
            } else {
                throw new Error('Team member not found');
            }
        } catch (error) {
            throw new Error(`Failed to fetch team member: ${error.message}`);
        }
    }

    // Update team member
    async updateTeamMember(id, memberData) {
        try {


            return await this.update(id, memberData);
        } catch (error) {
            throw new Error(`Failed to update team member: ${error.message}`);
        }
    }

    // Delete team member
    async deleteTeamMember(id) {
        try {


            await this.delete(id);
            return { id, deleted: true };
        } catch (error) {
            throw new Error(`Failed to delete team member: ${error.message}`);
        }
    }

    // Toggle team member active status
    async toggleTeamMemberStatus(id, isActive) {
        try {


            const updateData = {
                isActive: !isActive
            };

            const result = await this.update(id, updateData);

            return {
                ...result,
                isActive: !isActive
            };
        } catch (error) {
            throw new Error(`Failed to update team member status: ${error.message}`);
        }
    }

    // Get team statistics
    async getTeamStats() {
        try {
            const members = await this.getAllTeamMembers();

            return {
                total: members.length,
                core: members.filter(m => m.category === 'core').length,
                employees: members.filter(m => m.category === 'employee').length,
                active: members.filter(m => m.isActive).length,
                inactive: members.filter(m => !m.isActive).length
            };
        } catch (error) {
            throw new Error(`Failed to fetch team statistics: ${error.message}`);
        }
    }

    // Search team members
    async searchTeamMembers(searchTerm) {
        try {
            const allMembers = await this.getAllTeamMembers();

            const searchLower = searchTerm.toLowerCase();
            return allMembers.filter(member =>
                member.name?.toLowerCase().includes(searchLower) ||
                member.title?.toLowerCase().includes(searchLower) ||
                member.location?.toLowerCase().includes(searchLower) ||
                member.bio?.toLowerCase().includes(searchLower)
            );
        } catch (error) {
            throw new Error(`Failed to search team members: ${error.message}`);
        }
    }
}

// Create singleton instances
export const eventService = new EventService();
export const resourceService = new ResourceService();
export const serviceService = new ServiceService();
export const galleryService = new GalleryService();
export const eventRegistrationService = new EventRegistrationService();
export const teamService = new TeamService();

// Export for compatibility
export { EventService as default }; 
