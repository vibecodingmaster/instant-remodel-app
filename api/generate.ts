/**
 * Serverless API function to proxy Gemini AI image generation requests
 * This keeps the API key secure on the server side
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

// Netlify function types
interface NetlifyEvent {
    httpMethod: string;
    headers: Record<string, string>;
    body: string | null;
}

interface NetlifyResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}


// Server-side API key access
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenAI(API_KEY);

// --- Helper Functions (moved from frontend) ---

/**
 * Creates a fallback prompt to use when the primary one is blocked.
 * @param style The design style string (e.g., "Modern").
 * @returns The fallback prompt string.
 */
function getFallbackPrompt(style: string): string {
    return `Create a photorealistic image showing a remodeled version of the room in this photo in the ${style} style. Focus on changing the furniture, wall color, and decor.`;
}

/**
 * Extracts the style (e.g., "Modern") from a prompt string.
 * @param prompt The original prompt.
 * @returns The style string or null if not found.
 */
function extractStyle(prompt: string): string | null {
    const match = prompt.match(/in a (Modern|Scandinavian|Industrial|Bohemian|Farmhouse|Minimalist) design style/);
    return match ? match[1] : null;
}

/**
 * Processes the Gemini API response, extracting the image or throwing an error if none is found.
 * @param response The response from the generateContent call.
 * @returns A data URL string for the generated image.
 */
function processGeminiResponse(response: any): string {
    console.log("Full Gemini response:", JSON.stringify(response, null, 2));
    
    // Look for image parts in the response - handle different possible response structures
    const candidates = response.candidates || response.response?.candidates;
    const firstCandidate = candidates?.[0];
    const parts = firstCandidate?.content?.parts;
    
    console.log("Candidates count:", candidates?.length || 0);
    console.log("Parts count:", parts?.length || 0);
    
    if (parts && parts.length > 0) {
        for (const part of parts) {
            if (part.inlineData) {
                const { mimeType, data } = part.inlineData;
                console.log("Image data details:", { mimeType, dataLength: data?.length || 0 });
                
                if (!data || data.length === 0) {
                    throw new Error("Image data is empty");
                }
                
                return `data:${mimeType};base64,${data}`;
            }
        }
    }

    // If no image part found, log the full response for debugging
    const textResponse = firstCandidate?.content?.parts?.find(p => p.text)?.text || 
                        response.text || 
                        JSON.stringify(firstCandidate?.content);
    console.error("API did not return an image. Full response:", response);
    throw new Error(`The AI model did not generate an image. Response: "${textResponse || 'No valid response received.'}"`);
}

/**
 * A wrapper for the Gemini API call that includes a retry mechanism for internal server errors.
 * @param parts The array of image and text parts for the request payload.
 * @returns The GenerateContentResponse from the API.
 */
async function callGeminiWithRetry(parts: object[]): Promise<GenerateContentResponse> {
    const maxRetries = 3;
    const initialDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log("Calling Gemini 2.5 Flash Image Preview for image generation");
            console.log("Prompt being sent:", parts.find(p => 'text' in p)?.text?.substring(0, 200));
            
            // Use the correct API format for image generation
            const response = await genAI.models.generateContent({
                model: "gemini-2.5-flash-image-preview",
                contents: parts,
            });
            
            return response;
        } catch (error) {
            console.error(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            const isInternalError = errorMessage.includes('"code":500') || errorMessage.includes('INTERNAL');

            if (isInternalError && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.log(`Internal error detected. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error; // Re-throw if not a retriable error or if max retries are reached.
        }
    }
    // This should be unreachable due to the loop and throw logic above.
    throw new Error("Gemini API call failed after all retries.");
}

/**
 * Core image generation logic (moved from frontend geminiService.ts)
 */
async function generateStyleImage(imageDataUrls: string[], prompt: string): Promise<string> {
    const imageParts = imageDataUrls.map(url => {
        const match = url.match(/^data:(image\/\w+);base64,(.*)$/);
        if (!match) {
            throw new Error("Invalid image data URL format. Expected 'data:image/...;base64,...'");
        }
        const [, mimeType, base64Data] = match;
        return {
            inlineData: { mimeType, data: base64Data },
        };
    });
    
    const textPart = { text: prompt };

    // --- First attempt with the original prompt ---
    try {
        console.log("Attempting generation with original prompt...");
        const allParts = [...imageParts, textPart];
        const response = await callGeminiWithRetry(allParts);
        return processGeminiResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        const isNoImageError = errorMessage.includes("The AI model responded with text instead of an image");

        if (isNoImageError) {
            console.warn("Original prompt was likely blocked. Trying a fallback prompt.");
            const style = extractStyle(prompt);
            if (!style) {
                console.error("Could not extract style from prompt, cannot use fallback.");
                throw error; // Re-throw the original "no image" error.
            }

            // --- Second attempt with the fallback prompt ---
            try {
                const fallbackPrompt = getFallbackPrompt(style);
                console.log(`Attempting generation with fallback prompt for ${style}...`);
                const fallbackTextPart = { text: fallbackPrompt };
                const fallbackParts = [...imageParts, fallbackTextPart];
                const fallbackResponse = await callGeminiWithRetry(fallbackParts);
                return processGeminiResponse(fallbackResponse);
            } catch (fallbackError) {
                console.error("Fallback prompt also failed.", fallbackError);
                const finalErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                throw new Error(`The AI model failed with both original and fallback prompts. Last error: ${finalErrorMessage}`);
            }
        } else {
            // This is for other errors, like a final internal server error after retries.
            console.error("An unrecoverable error occurred during image generation.", error);
            throw new Error(`The AI model failed to generate an image. Details: ${errorMessage}`);
        }
    }
}

// --- Netlify Serverless Function Handler ---
export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
    // Enable CORS for frontend requests with security restrictions
    const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://anazuluaga.netlify.app'])
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];
    
    const origin = event.headers.origin;
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...(allowedOrigins.includes(origin) && { 'Access-Control-Allow-Origin': origin })
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                error: 'Method not allowed',
                message: 'Only POST requests are supported' 
            })
        };
    }

    try {
        // Parse request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { images, prompt } = body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Invalid request',
                    message: 'Missing or invalid "images" array in request body' 
                })
            };
        }

        if (!prompt || typeof prompt !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Invalid request',
                    message: 'Missing or invalid "prompt" string in request body' 
                })
            };
        }

        // Validate image data URLs
        for (const image of images) {
            if (!image.startsWith('data:image/')) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Invalid image format',
                        message: 'All images must be valid data URLs starting with "data:image/"' 
                    })
                };
            }
        }

        // Generate the image using the same logic as the frontend
        console.log(`Generating image with ${images.length} input image(s) and prompt: "${prompt.substring(0, 100)}..."`);
        
        const imageUrl = await generateStyleImage(images, prompt);

        // Return the generated image URL
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                imageUrl,
                success: true,
                message: 'Image generated successfully'
            })
        };

    } catch (error) {
        console.error('Error in generate API function:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Image generation failed',
                message: errorMessage,
                success: false 
            })
        };
    }
};