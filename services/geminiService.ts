/**
 * Frontend service for image generation via secure backend proxy
 * This replaces the direct Google AI API calls with secure backend proxy calls
 * @license SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates a style-based remodel image by calling the secure backend API
 * @param imageDataUrls An array of data URL strings of the source images.
 * @param prompt The prompt to guide the image generation.
 * @returns A promise that resolves to a base64-encoded image data URL of the generated image.
 */
export async function generateStyleImage(imageDataUrls: string[], prompt: string): Promise<string> {
    try {
        // Validate inputs on frontend
        if (!imageDataUrls || !Array.isArray(imageDataUrls) || imageDataUrls.length === 0) {
            throw new Error("At least one image is required for remodeling");
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new Error("A prompt is required for image generation");
        }

        // Validate image format
        for (const imageUrl of imageDataUrls) {
            if (!imageUrl.startsWith('data:image/')) {
                throw new Error("All images must be valid data URLs");
            }
        }

        console.log(`Sending request to backend API with ${imageDataUrls.length} image(s) and prompt: "${prompt.substring(0, 100)}..."`);

        // Call the secure backend API
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                images: imageDataUrls,
                prompt: prompt
            }),
        });

        // Handle non-200 responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || `Server responded with status: ${response.status}`;
            
            console.error(`Backend API error (${response.status}):`, errorData);
            throw new Error(`Image generation failed: ${errorMessage}`);
        }

        // Parse successful response
        const data = await response.json();
        
        if (!data.success || !data.imageUrl) {
            throw new Error(data.message || 'Backend API returned invalid response format');
        }

        console.log('Image generated successfully via backend API');
        return data.imageUrl;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error calling backend image generation service:", error);
        
        // Provide user-friendly error messages
        if (errorMessage.includes('IMAGE_GENERATION_NOT_SUPPORTED')) {
            throw new Error('⚠️ Technical Issue: This application is configured to use Google Gemini API, which cannot generate images. To enable image generation, the application needs to be updated to use an image generation service like DALL-E or Stable Diffusion.');
        }
        
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            throw new Error('Network error: Unable to connect to the image generation service. Please check your internet connection and try again.');
        }
        
        if (errorMessage.includes('Server responded with status: 5')) {
            throw new Error('Server error: The image generation service is temporarily unavailable. Please try again in a few minutes.');
        }
        
        throw new Error(`Failed to generate image: ${errorMessage}`);
    }
}