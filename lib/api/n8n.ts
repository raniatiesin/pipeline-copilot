import { StyleImage } from '../../types';

const N8N_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL;

export interface StyleGenerationRequest {
  client_name: string;
  style_prompt: string;
  selected_tags: string[];
}

export async function generateStyleImages(request: StyleGenerationRequest): Promise<StyleImage[]> {
  // For development/testing - return mock data if n8n not configured
  if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes('your-webhook-id-here')) {
    console.warn('Using mock data - n8n webhook not configured');
    
    // Return mock style images for testing
    return [
      {
        id: 'mock-1',
        url: 'https://picsum.photos/300/300?random=1',
        title: 'Modern Minimalist Style'
      },
      {
        id: 'mock-2', 
        url: 'https://picsum.photos/300/300?random=2',
        title: 'Bold Contemporary'
      },
      {
        id: 'mock-3',
        url: 'https://picsum.photos/300/300?random=3', 
        title: 'Elegant Classic'
      },
      {
        id: 'mock-4',
        url: 'https://picsum.photos/300/300?random=4',
        title: 'Artistic Expression'
      },
      {
        id: 'mock-5',
        url: 'https://picsum.photos/300/300?random=5',
        title: 'Professional Clean'
      },
      {
        id: 'mock-6',
        url: 'https://picsum.photos/300/300?random=6',
        title: 'Playful Creative'
      }
    ];
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data.images)) {
      throw new Error('Invalid response format from n8n webhook');
    }

    return data.images;
  } catch (error) {
    console.error('Style generation error:', error);
    throw new Error(`Failed to generate styles: ${(error as Error).message}`);
  }
}