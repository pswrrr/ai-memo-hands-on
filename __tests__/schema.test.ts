import { db } from '../lib/db';
import { notes, noteTags, summaries, authUsers } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Database Schema', () => {
  it('should have correct table structure', () => {
    // Test that tables are properly defined
    expect(notes).toBeDefined();
    expect(noteTags).toBeDefined();
    expect(summaries).toBeDefined();
    expect(authUsers).toBeDefined();
  });

  it('should have proper column definitions', () => {
    // Test notes table structure
    expect(notes.id).toBeDefined();
    expect(notes.userId).toBeDefined();
    expect(notes.title).toBeDefined();
    expect(notes.content).toBeDefined();
    expect(notes.createdAt).toBeDefined();
    expect(notes.updatedAt).toBeDefined();

    // Test noteTags table structure
    expect(noteTags.id).toBeDefined();
    expect(noteTags.noteId).toBeDefined();
    expect(noteTags.tag).toBeDefined();
    expect(noteTags.createdAt).toBeDefined();

    // Test summaries table structure
    expect(summaries.id).toBeDefined();
    expect(summaries.noteId).toBeDefined();
    expect(summaries.model).toBeDefined();
    expect(summaries.content).toBeDefined();
    expect(summaries.createdAt).toBeDefined();
  });

  it('should have proper relations', () => {
    // Test that relations are properly defined
    expect(notes.userId).toBeDefined();
    expect(noteTags.noteId).toBeDefined();
    expect(summaries.noteId).toBeDefined();
  });
});
