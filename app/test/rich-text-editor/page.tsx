'use client';

import RichTextEditor from '@/components/notes/RichTextEditor';
import { useState } from 'react';

export default function TestRichTextEditorPage() {
  const [content, setContent] = useState('');

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">리치 텍스트 에디터 테스트</h1>
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="테스트용 리치 텍스트 에디터"
        maxLength={10000}
        rows={10}
      />
    </div>
  );
}
