import { useState, useCallback, useEffect } from 'react';
import { ContentItem, CreateContentInput, UpdateContentInput, FieldType } from '../types';
import api from '../services/api';

interface UseContentState {
    contents: ContentItem[];
    loading: boolean;
    error: string | null;
    selectedContent: ContentItem | null;
}

export const useContent = () => {
    const [state, setState] = useState<UseContentState>({
        contents: [],
        loading: false,
        error: null,
        selectedContent: null,
    });

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({ ...prev, loading, error: null }));
    }, []);

    const setError = useCallback((error: string) => {
        setState(prev => ({ ...prev, error, loading: false }));
    }, []);

    const fetchContents = useCallback(async (content_type_id?: string) => {
        setLoading(true);
        try {
            const contents = await api.listContent(content_type_id);
            setState(prev => ({ ...prev, contents, loading: false }));
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch contents');
        }
    }, [setLoading, setError]);

    const createContent = useCallback(async (input: CreateContentInput) => {
        setLoading(true);
        try {
            const newContent = await api.createContent(input);
            setState(prev => ({
                ...prev,
                contents: [newContent, ...prev.contents],
                loading: false,
            }));
            return newContent;
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create content');
            throw error;
        }
    }, [setLoading, setError]);

    const updateContent = useCallback(async (input: UpdateContentInput) => {
        setLoading(true);
        try {
            const updatedContent = await api.updateContent(input);
            setState(prev => ({
                ...prev,
                contents: prev.contents.map(c => 
                    c.id === updatedContent.id ? updatedContent : c
                ),
                selectedContent: prev.selectedContent?.id === updatedContent.id 
                    ? updatedContent 
                    : prev.selectedContent,
                loading: false,
            }));
            return updatedContent;
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update content');
            throw error;
        }
    }, [setLoading, setError]);

    const deleteContent = useCallback(async (id: string) => {
        setLoading(true);
        try {
            await api.deleteContent(id);
            setState(prev => ({
                ...prev,
                contents: prev.contents.filter(c => c.id !== id),
                selectedContent: prev.selectedContent?.id === id ? null : prev.selectedContent,
                loading: false,
            }));
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to delete content');
            // Don't throw the error, just set it in state
            console.error('Delete content error:', error);
            // Re-throw the error so the calling component can handle it
            throw error;
        }
    }, [setLoading, setError]);

    const selectContent = useCallback((content: ContentItem | null) => {
        setState(prev => ({ ...prev, selectedContent: content }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const fetchContentById = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const content = await api.readContent(id);
            setState(prev => ({
                ...prev,
                selectedContent: content,
                contents: prev.contents.map(c => c.id === content.id ? content : c),
                loading: false,
            }));
            return content;
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch content');
            throw error;
        }
    }, [setLoading, setError]);

    return {
        ...state,
        fetchContents,
        createContent,
        updateContent,
        deleteContent,
        selectContent,
        clearError,
        fetchContentById,
    };
};
