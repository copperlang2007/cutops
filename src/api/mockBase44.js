// Mock implementation of @base44/sdk for development/preview purposes
// This allows the application to render with clay design without actual backend

const createMockEntity = (entityName) => ({
  list: async (sortBy) => {
    console.log(`Mock: Fetching ${entityName} list (sorted by: ${sortBy})`);
    return [];
  },
  get: async (id) => {
    console.log(`Mock: Fetching ${entityName} with id: ${id}`);
    return null;
  },
  create: async (data) => {
    console.log(`Mock: Creating ${entityName}`, data);
    return { id: 'mock-id', ...data };
  },
  update: async (id, data) => {
    console.log(`Mock: Updating ${entityName} ${id}`, data);
    return { id, ...data };
  },
  delete: async (id) => {
    console.log(`Mock: Deleting ${entityName} ${id}`);
    return { success: true };
  }
});

export const createClient = ({ appId, requiresAuth }) => {
  console.log(`Mock Base44 Client created with appId: ${appId}, requiresAuth: ${requiresAuth}`);
  
  return {
    entities: {
      Agent: createMockEntity('Agent'),
      License: createMockEntity('License'),
      CarrierAppointment: createMockEntity('CarrierAppointment'),
      Client: createMockEntity('Client'),
      Carrier: createMockEntity('Carrier'),
      Task: createMockEntity('Task'),
      Interaction: createMockEntity('Interaction'),
      Document: createMockEntity('Document'),
      Lead: createMockEntity('Lead'),
      Commission: createMockEntity('Commission'),
      Training: createMockEntity('Training'),
      Policy: createMockEntity('Policy'),
      Contract: createMockEntity('Contract'),
      User: createMockEntity('User'),
      // Add other entities as needed
    },
    auth: {
      getCurrentUser: async () => {
        console.log('Mock: Getting current user');
        return {
          id: 'mock-user-id',
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin'
        };
      },
      login: async (credentials) => {
        console.log('Mock: Login attempt', credentials);
        return { success: true, token: 'mock-token' };
      },
      logout: async () => {
        console.log('Mock: Logout');
        return { success: true };
      }
    }
  };
};

export default { createClient };
