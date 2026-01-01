import { apiClient } from '@/lib/api-client';

import type { ChatRequest, ChatResponse } from './types';

const API_URL = '/api/v1/ai';

export const aiApi = {
  chat: (message: string) =>
    apiClient.post<ChatResponse>(`${API_URL}/chat`, { message } as ChatRequest),
};
