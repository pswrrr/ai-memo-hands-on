'use client';

import AdvancedToolbar from '@/components/notes/AdvancedToolbar';
import { useState } from 'react';

export default function TestAdvancedToolsPage() {
  const [content, setContent] = useState('');

  const handleSave = () => {
    console.log('저장됨:', content);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">고급 편집 도구 테스트</h1>
      <AdvancedToolbar
        content={content}
        onContentChange={setContent}
        onSave={handleSave}
      />
      <div className="mt-4 p-4 border rounded">
        <p>현재 내용: {content}</p>
      </div>
    </div>
  );
}
