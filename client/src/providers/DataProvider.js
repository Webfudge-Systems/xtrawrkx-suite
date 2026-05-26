// Data Provider - Static data only (no Firebase CMS)
import { resourcesData } from '../data/ResourcesData';
import { eventsData } from '../data/EventsData';
import servicesData from '../data/ServicesData';

export class DataProvider {
    // Resources - Static data only
    static async getResources() {
        return resourcesData;
    }

    static async getResourceBySlug(slug) {
        return resourcesData.find(resource => resource.slug === slug) || null;
    }

    static async getFeaturedResources() {
        return resourcesData.filter(resource => resource.featured);
    }

    static async getResourcesByType(type) {
        return resourcesData.filter(resource => resource.type === type);
    }

    static async getResourcesByCategory(category) {
        return resourcesData.filter(resource => resource.category === category);
    }

    // Events - Static data only
    static async getEvents() {
        return eventsData;
    }

    static async getEventBySlug(slug) {
        return eventsData.find(event => event.slug === slug) || null;
    }

    static async getUpcomingEvents() {
        const now = new Date();
        return eventsData.filter(event => new Date(event.date) > now);
    }

    static async getPastEvents() {
        const now = new Date();
        return eventsData.filter(event => new Date(event.date) <= now);
    }

    static async getFeaturedEvents() {
        return eventsData.filter(event => event.featured);
    }

    // Services - Static data only
    static async getServices() {
        return servicesData;
    }

    static async getServiceBySlug(slug) {
        return servicesData.find(service => service.slug === slug) || null;
    }

    static async getFeaturedServices() {
        return servicesData.filter(service => service.featured);
    }

    static async getServicesByCategory(category) {
        return servicesData.filter(service => service.category === category);
    }
} 