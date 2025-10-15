'use client';

import MarkdownEditor from '@/components/notes/MarkdownEditor';
import { useState } from 'react';

export default function TestMarkdownEditorPage() {
  const [content, setContent] = useState('');

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">마크다운 에디터 테스트</h1>
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="테스트용 마크다운 에디터"
        maxLength={10000}
        rows={10}
      />
    </div>
  );
}
