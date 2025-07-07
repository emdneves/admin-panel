export type FieldType = 'number' | 'text' | 'date' | 'boolean' | 'relation' | 'media' | 'enum' | 'price';

export interface ContentField {
  name: string;
  type: FieldType;
  optional?: boolean;
  relation?: string; // for relation type, the related content type id
  options?: string[]; // for enum type, the allowed options
}

export interface ContentType {
  id: string;
  name: string;
  fields: ContentField[];
  created_at: string;
  updated_at: string;
  created_by?: UserInfo | null;
  updated_by?: UserInfo | null;
}

export interface ContentItem {
  id: string;
  content_type_id: string;
  data: Record<string, number | string | Date>;
  created_at: string;
  updated_at: string;
  created_by?: UserInfo | null;
  updated_by?: UserInfo | null;
}

export interface CreateContentTypeInput {
  name: string;
  fields: ContentField[];
}

export interface CreateContentInput {
  content_type_id: string;
  data: Record<string, number | string | Date>;
}

export interface UpdateContentInput {
  id: string;
  data: Record<string, unknown>;
}

export interface ContentTypeResponse {
  success: boolean;
  contentType?: ContentType;
  error?: string;
}

export interface ContentTypeListResponse {
  success: boolean;
  contentTypes: ContentType[];
  error?: string;
}

export interface ContentResponse {
  success: boolean;
  content?: ContentItem;
  error?: string;
}

export interface ListResponse {
  success: boolean;
  contents: ContentItem[];
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
}

export interface UserInfo {
  id: number;
  email: string;
  role: string;
}
