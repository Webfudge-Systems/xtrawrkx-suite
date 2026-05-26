import strapiClient from '../strapiClient';

class ClientPortalDocumentService {
    async getAll(params = {}) {
        try {
            const response = await strapiClient.getClientPortalDocuments(params);
            if (Array.isArray(response)) {
                return {
                    data: response,
                    meta: {
                        pagination: {
                            total: response.length,
                            page: 1,
                            pageSize: response.length,
                            pageCount: 1,
                        },
                    },
                };
            }
            return response;
        } catch (error) {
            console.error('Error fetching client portal documents:', error);
            return { data: [], meta: { pagination: { total: 0 } } };
        }
    }

    async getById(id, params = {}) {
        try {
            const response = await strapiClient.getClientPortalDocument(id, params);
            return { data: response?.data ?? response };
        } catch (error) {
            console.error(`Error fetching document ${id}:`, error);
            return { data: null };
        }
    }

    async create(data) {
        const response = await strapiClient.createClientPortalDocument(data);
        return response.data || response;
    }

    async update(id, data) {
        const response = await strapiClient.updateClientPortalDocument(id, data);
        return response.data || response;
    }

    async delete(id) {
        await strapiClient.deleteClientPortalDocument(id);
        return true;
    }

    async getByClientAccount(clientAccountId, params = {}) {
        const queryParams = {
            'filters[clientAccount][id][$eq]': clientAccountId,
            populate: ['clientAccount', 'createdBy', 'documents'],
            ...params,
        };
        return this.getAll(queryParams);
    }

    async uploadFiles(documentId, files) {
        const list = Array.isArray(files) ? files : [files];
        const results = [];
        for (const file of list) {
            if (!file) continue;
            const formData = new FormData();
            formData.append('files', file);
            formData.append('refId', documentId);
            formData.append('ref', 'api::client-portal-document.client-portal-document');
            formData.append('field', 'documents');

            const response = await fetch(`${strapiClient.baseURL}/api/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${strapiClient.getToken()}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }
            results.push(await response.json());
        }
        return results;
    }
}

export function resolveMediaUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        'http://localhost:1337';
    return `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

export function getDocumentAttachments(row) {
    const raw = row?.documents;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (raw.data) {
        return Array.isArray(raw.data) ? raw.data : [raw.data];
    }
    return [];
}

export default new ClientPortalDocumentService();
