import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateNoteForm from '../components/notes/CreateNoteForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock server action
jest.mock('../app/actions/notes', () => ({
  createNote: jest.fn(),
}));

describe('CreateNoteForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form elements correctly', () => {
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('새 노트 작성')).toBeInTheDocument();
    expect(screen.getByLabelText('제목 *')).toBeInTheDocument();
    expect(screen.getByLabelText('내용')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument();
  });

  it('validates required title field', async () => {
    const user = userEvent.setup();
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument();
    });
  });

  it('validates title length', async () => {
    const user = userEvent.setup();
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText('제목 *');
    const longTitle = 'a'.repeat(256);
    
    await user.type(titleInput, longTitle);
    
    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('제목은 255자를 초과할 수 없습니다')).toBeInTheDocument();
    });
  });

  it('validates content length', async () => {
    const user = userEvent.setup();
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText('제목 *');
    const contentInput = screen.getByLabelText('내용');
    const longContent = 'a'.repeat(10001);
    
    await user.type(titleInput, 'Test Title');
    await user.type(contentInput, longContent);
    
    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('내용은 10,000자를 초과할 수 없습니다')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const { createNote } = require('../app/actions/notes');
    createNote.mockResolvedValue({ success: true, noteId: 'test-note-id' });
    
    const user = userEvent.setup();
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText('제목 *');
    const contentInput = screen.getByLabelText('내용');
    
    await user.type(titleInput, 'Test Title');
    await user.type(contentInput, 'Test Content');
    
    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith(expect.any(FormData));
      expect(mockOnSuccess).toHaveBeenCalledWith('test-note-id');
    });
  });

  it('handles form submission error', async () => {
    const { createNote } = require('../app/actions/notes');
    createNote.mockResolvedValue({ success: false, error: 'Test error' });
    
    const user = userEvent.setup();
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText('제목 *');
    await user.type(titleInput, 'Test Title');
    
    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const { createNote } = require('../app/actions/notes');
    createNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const user = userEvent.setup();
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText('제목 *');
    await user.type(titleInput, 'Test Title');
    
    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);
    
    expect(screen.getByText('저장 중...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /취소/i });
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows confirmation dialog when canceling with content', async () => {
    const user = userEvent.setup();
    render(<CreateNoteForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText('제목 *');
    await user.type(titleInput, 'Test Title');
    
    const cancelButton = screen.getByRole('button', { name: /취소/i });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => false);
    
    await user.click(cancelButton);
    
    expect(window.confirm).toHaveBeenCalledWith('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?');
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});
