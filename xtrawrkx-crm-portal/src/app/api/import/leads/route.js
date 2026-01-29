import { NextResponse } from 'next/server';
import { parseFile } from '../../../../lib/utils/fileParser';
import strapiClient from '../../../../lib/strapiClient';

/**
 * POST /api/import/leads
 * Import leads (lead companies) from CSV/Excel file
 */
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Parse the file
        const rows = await parseFile(file);

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'File is empty or could not be parsed' },
                { status: 400 }
            );
        }

        // Log headers for debugging
        const headers = Object.keys(rows[0] || {});

        // Field mapping for lead companies - note: headers are already normalized to lowercase with underscores
        const fieldMapping = {
            name: ['company_name', 'name', 'company', 'organization', 'org', 'primary_co'], // Added primary_co as fallback
            website: ['website', 'website_url', 'url', 'web'],
            industry: ['industry', 'sector', 'business_type'],
            status: ['status', 'lead_status', 'stage'],
            source: ['source', 'lead_source', 'leadsource'],
            phone: ['phone', 'phone_number', 'telephone', 'tel'],
            email: ['email', 'email_address', 'company_email'],
            address: ['address', 'street_address', 'location'],
            city: ['city'],
            state: ['state', 'province', 'region'],
            zipCode: ['zip', 'zip_code', 'postal_code', 'postcode'],
            country: ['country'],
            employeeCount: ['employees', 'employee_count', 'size', 'company_size'],
            annualRevenue: ['revenue', 'annual_revenue', 'revenue_amount', 'deal_value', 'dealvalue'],
            notes: ['notes', 'note', 'comments', 'description'],
        };

        // Auto-detect column mapping
        // Headers are already normalized to lowercase with underscores by fileParser
        const columnMap = {};

        Object.keys(fieldMapping).forEach((field) => {
            const variations = fieldMapping[field];
            for (const header of headers) {
                // Headers are already lowercase with underscores, so compare directly
                const headerNormalized = header.toLowerCase().replace(/\s+/g, '_');
                if (variations.some((v) => {
                    const vNormalized = v.toLowerCase().replace(/\s+/g, '_');
                    return headerNormalized === vNormalized || headerNormalized.includes(vNormalized) || vNormalized.includes(headerNormalized);
                })) {
                    columnMap[field] = header;
                    break;
                }
            }
        });


        // Process each row
        const results = {
            total: rows.length,
            imported: 0,
            errors: 0,
            errorsList: [],
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            try {
                // Map row data to lead company format
                const leadCompanyData = {};

                // Try to get company name from various possible column names
                // Headers are normalized to lowercase with underscores, so "Company" becomes "company"
                const companyName = row[columnMap.name] ||
                    row.company_name ||
                    row.company ||  // This is the normalized header from Excel
                    row.name ||
                    row.organization ||
                    row.org ||
                    row.primary_co || // Handle "Primary Co" column
                    '';

                // If company name is missing, try to generate one from available data
                if (!companyName || companyName.trim() === '') {
                    // Try to use email domain as company name
                    const email = row[columnMap.email] || row.email || '';
                    if (email && email.includes('@')) {
                        const domain = email.split('@')[1];
                        leadCompanyData.companyName = domain.split('.')[0].charAt(0).toUpperCase() +
                            domain.split('.')[0].slice(1) + ' Company';
                    } else {
                        // Use a default name with row number
                        leadCompanyData.companyName = `Imported Company ${rowNumber}`;
                    }
                } else {
                    leadCompanyData.companyName = companyName.trim();
                }

                // Optional fields - try to get from various column names, otherwise use defaults
                // Website
                const website = row[columnMap.website] || row.website || row.website_url || row.url || row.web || '';
                if (website) {
                    leadCompanyData.website = String(website).trim();
                }

                // Industry - required field, set default if missing
                const industry = row[columnMap.industry] || row.industry || row.sector || row.business_type || '';
                if (industry) {
                    leadCompanyData.industry = String(industry).trim().toLowerCase();
                } else {
                    leadCompanyData.industry = 'other'; // Default industry
                }

                // Status - normalize to uppercase enum values
                const status = row[columnMap.status] || row.status || row.lead_status || row.stage || '';
                if (status) {
                    const statusValue = String(status).trim();
                    const statusMap = {
                        'new': 'NEW',
                        'contacted': 'CONTACTED',
                        'qualified': 'QUALIFIED',
                        'converted': 'CONVERTED',
                        'lost': 'LOST',
                    };
                    leadCompanyData.status = statusMap[statusValue.toLowerCase()] || statusValue.toUpperCase();
                } else {
                    leadCompanyData.status = 'NEW'; // Default status
                }

                // Source
                const source = row[columnMap.source] || row.source || row.lead_source || row.leadsource || '';
                if (source) {
                    const sourceValue = String(source).trim();
                    leadCompanyData.source = sourceValue.toUpperCase();
                } else {
                    leadCompanyData.source = 'IMPORT'; // Default source
                }

                // Segment - always set default
                leadCompanyData.segment = 'WARM';

                // Phone
                const phone = row[columnMap.phone] || row.phone || row.phone_number || row.telephone || row.tel || '';
                if (phone) {
                    leadCompanyData.phone = String(phone).trim();
                }

                // Email
                const email = row[columnMap.email] || row.email || row.email_address || row.company_email || '';
                if (email) {
                    leadCompanyData.email = String(email).trim();
                }

                // Address - check normalized headers
                const address = row[columnMap.address] || row.address || row.street_address || row.location || '';
                if (address && String(address).trim()) {
                    leadCompanyData.address = String(address).trim();
                }

                // City - check normalized headers
                const city = row[columnMap.city] || row.city || '';
                if (city && String(city).trim()) {
                    leadCompanyData.city = String(city).trim();
                }

                // State - check normalized headers
                const state = row[columnMap.state] || row.state || row.province || row.region || '';
                if (state && String(state).trim()) {
                    leadCompanyData.state = String(state).trim();
                }

                // Zip Code - check normalized headers
                const zipCode = row[columnMap.zipCode] || row.zip || row.zip_code || row.postal_code || row.postcode || '';
                if (zipCode && String(zipCode).trim()) {
                    leadCompanyData.zipCode = String(zipCode).trim();
                }

                // Country - check normalized headers
                const country = row[columnMap.country] || row.country || '';
                if (country && String(country).trim()) {
                    leadCompanyData.country = String(country).trim();
                }

                // Employees - handle enum values
                if (row[columnMap.employeeCount] || row.employees || row.employee_count || row.size || row.company_size) {
                    const empCount = row[columnMap.employeeCount] || row.employees || row.employee_count || row.size || row.company_size;
                    // Try to map to enum values, otherwise store as string
                    const empValue = empCount.toString().toUpperCase();
                    // Map common values to enum
                    const empMap = {
                        '1-10': 'SIZE_1_10',
                        '11-50': 'SIZE_11_50',
                        '51-200': 'SIZE_51_200',
                        '201-500': 'SIZE_201_500',
                        '501-1000': 'SIZE_501_1000',
                        '1000+': 'SIZE_1000_PLUS',
                    };
                    leadCompanyData.employees = empMap[empValue] || empValue;
                }

                // Deal Value / Revenue
                if (row[columnMap.annualRevenue] || row.revenue || row.annual_revenue || row.revenue_amount || row.deal_value || row.dealvalue) {
                    const revenue = row[columnMap.annualRevenue] || row.revenue || row.annual_revenue || row.revenue_amount || row.deal_value || row.dealvalue;
                    const revenueValue = parseFloat(revenue);
                    if (!isNaN(revenueValue)) {
                        leadCompanyData.dealValue = revenueValue;
                    }
                } else {
                    leadCompanyData.dealValue = 0; // Default deal value
                }

                // Notes
                if (row[columnMap.notes] || row.notes || row.note || row.comments || row.description) {
                    leadCompanyData.notes = (row[columnMap.notes] || row.notes || row.note || row.comments || row.description).trim();
                }

                // Create lead company via Strapi
                const response = await strapiClient.createLeadCompany(leadCompanyData);

                if (response && (response.data || response.id)) {
                    results.imported++;
                } else {
                    throw new Error('Failed to create lead company');
                }
            } catch (error) {
                console.error(`Error importing row ${rowNumber}:`, error);
                const errorMessage = error.message || 'Unknown error';
                results.errorsList.push(`Row ${rowNumber}: ${errorMessage}`);
                results.errors++;
            }
        }

        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error('Error importing leads:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to import leads',
            },
            { status: 500 }
        );
    }
}

