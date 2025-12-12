// Using mock implementation for UI preview
// Replace with real SDK when available: import { createClient } from '@base44/sdk';
import { createClient } from './mockBase44.js';

// Create a client with authentication required
export const base44 = createClient({
  appId: "692cbfadf832bf395bc7327f", 
  requiresAuth: true // Ensure authentication is required for all operations
});
