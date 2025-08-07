import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse JSON from a fetch response with proper error handling
 * @param response - The fetch response object
 * @returns Promise resolving to parsed JSON data
 * @throws Error with descriptive message if parsing fails
 */
export async function safeFetchJson(response: Response) {
   
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

   
  const text = await response.text()
  if (!text) {
    throw new Error('Empty response from server')
  }

   
  try {
    return JSON.parse(text)
  } catch (parseError) {
    console.error('Failed to parse JSON response:', text)
    throw new Error('Invalid JSON response from server')
  }
}
