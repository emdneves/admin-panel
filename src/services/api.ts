/// <reference types="vite/client" />

import axios, { AxiosInstance } from 'axios';
import {
    ContentItem,
    CreateContentInput,
    UpdateContentInput,
    ContentResponse,
    ListResponse,
    ContentType,
    ContentField,
    CreateContentTypeInput,
    ContentTypeResponse,
    ContentTypeListResponse,
    FieldType
} from '../types';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include JWT token only for non-public endpoints
        this.api.interceptors.request.use(
            config => {
                const token = localStorage.getItem('token');
                // List of public endpoints
                const publicEndpoints = [
                  '/content/list',
                  '/content/read',
                  '/content-type/list',
                  '/content-type/read',
                  '/health'
                ];
                const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
                if (token && !isPublic) {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = `Bearer ${token}`;
                } else if (isPublic && config.headers && config.headers['Authorization']) {
                    // Remove Authorization header if present for public endpoints
                    delete config.headers['Authorization'];
                }
                return config;
            },
            error => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.data?.error) {
                    throw new Error(error.response.data.error);
                }
                throw error;
            }
        );
    }

    // Content Type CRUD
    async createContentType(input: CreateContentTypeInput): Promise<ContentType> {
        const response = await this.api.post<ContentTypeResponse>('/content-type/create', input);
        if (!response.data.success || !response.data.contentType) {
            throw new Error(response.data.error || 'Failed to create content type');
        }
        return response.data.contentType;
    }

    async listContentTypes(): Promise<ContentType[]> {
        const response = await this.api.get<ContentTypeListResponse>('/content-type/list');
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to list content types');
        }
        return response.data.contentTypes;
    }

    async getContentType(id: string): Promise<ContentType> {
        const response = await this.api.get<ContentTypeResponse>(`/content-type/read/${id}`);
        if (!response.data.success || !response.data.contentType) {
            throw new Error(response.data.error || 'Failed to get content type');
        }
        return response.data.contentType;
    }

    async updateContentType(id: string, input: Partial<CreateContentTypeInput>): Promise<ContentType> {
        const response = await this.api.post<ContentTypeResponse>(
            '/content-type/update',
            { id, ...input }
        );
        if (!response.data.success || !response.data.contentType) {
            throw new Error(response.data.error || 'Failed to update content type');
        }
        return response.data.contentType;
    }

    async deleteContentType(id: string): Promise<void> {
        const response = await this.api.delete<ContentTypeResponse>(`/content-type/delete/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete content type');
        }
    }

    // Content CRUD
    async createContent(input: CreateContentInput): Promise<ContentItem> {
        const response = await this.api.post<ContentResponse>('/content/create', input);
        if (!response.data.success || !response.data.content) {
            throw new Error(response.data.error || 'Failed to create content');
        }
        return response.data.content;
    }

    async readContent(id: string): Promise<ContentItem> {
        const response = await this.api.post<ContentResponse>('/content/read', { id });
        if (!response.data.success || !response.data.content) {
            throw new Error(response.data.error || 'Failed to read content');
        }
        return response.data.content;
    }

    async updateContent(input: UpdateContentInput): Promise<ContentItem> {
        const response = await this.api.post<ContentResponse>('/content/update', input);
        if (!response.data.success || !response.data.content) {
            throw new Error(response.data.error || 'Failed to update content');
        }
        return response.data.content;
    }

    async deleteContent(id: string): Promise<void> {
        const response = await this.api.post<ContentResponse>('/content/delete', { id });
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete content');
        }
    }

    async listContent(content_type_id?: string): Promise<ContentItem[]> {
        const response = await this.api.post<ListResponse>('/content/list', { content_type_id });
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to list content');
        }
        return response.data.contents;
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await this.api.get('/health');
            return response.data.status === 'ok';
        } catch {
            return false;
        }
    }

    async registerUser(input: { email: string; password: string; role: string; first_name: string; last_name: string }): Promise<{ success: boolean; error?: string }> {
        const response = await this.api.post('/register', input);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to register user');
        }
        return response.data;
    }

    // User Management (Admin Only)
    async listUsers(): Promise<any[]> {
        const response = await this.api.get('/users');
        if (!response.data.users) {
            throw new Error(response.data.error || 'Failed to list users');
        }
        return response.data.users;
    }

    async getUser(id: string | number): Promise<any> {
        const response = await this.api.get(`/users/${id}`);
        if (!response.data.user) {
            throw new Error(response.data.error || 'Failed to get user');
        }
        return response.data.user;
    }

    async updateUser(id: string | number, input: { email: string; role: string; first_name: string; last_name: string; is_active: boolean }): Promise<any> {
        const response = await this.api.put(`/users/${id}`, input);
        if (!response.data.user) {
            throw new Error(response.data.error || 'Failed to update user');
        }
        return response.data.user;
    }

    async deleteUser(id: string | number): Promise<void> {
        const response = await this.api.delete(`/users/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete user');
        }
    }

    // Activity Log (Audit Log)
    async getActivityLogs(params: {
        page?: number;
        pageSize?: number;
        userId?: string;
        actionType?: string;
        startDate?: string;
        endDate?: string;
    } = {}): Promise<{
        logs: any[];
        total: number;
        page: number;
        pageSize: number;
    }> {
        const response = await this.api.get('/activity-log', { params });
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch activity logs');
        }
        return {
            logs: response.data.logs,
            total: response.data.total,
            page: response.data.page,
            pageSize: response.data.pageSize,
        };
    }

    async getActivityLogById(id: string | number): Promise<any> {
        const response = await this.api.get(`/activity-log/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch activity log entry');
        }
        return response.data.log;
    }

    async createActivityLog(input: {
        userId?: number;
        action: string;
        target: string;
        targetId?: string;
        metadata?: any;
    }): Promise<void> {
        const response = await this.api.post('/activity-log', input);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to create activity log entry');
        }
    }
}

export default new ApiService();
