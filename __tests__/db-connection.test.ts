import { checkConnection, closeConnection } from '../lib/db';

describe('Database Connection', () => {
  afterAll(async () => {
    await closeConnection();
  });

  it('should have proper environment configuration', () => {
    // Test that environment variables are properly configured
    expect(process.env.DATABASE_URL).toBeDefined();
    // Check if it's a valid database URL format
    expect(process.env.DATABASE_URL).toMatch(/^(postgresql|postgres):\/\//);
  });

  it('should connect to database successfully', async () => {
    const isConnected = await checkConnection();
    expect(isConnected).toBe(true);
  });
});
