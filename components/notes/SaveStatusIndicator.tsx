// components/notes/SaveStatusIndicator.tsx
// 자동 저장 상태를 시각적으로 표시하는 컴포넌트
// 저장 중, 저장 완료, 에러 상태를 사용자에게 알림
// hooks/useAutoSave.ts, components/notes/NoteEditForm.tsx

import { Save, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { SaveStatus } from '@/hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
}

export default function SaveStatusIndicator({ status, lastSaved }: SaveStatusIndicatorProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Save className="h-4 w-4 animate-spin" />,
          text: '저장 중...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'saved':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: '저장 완료',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: '저장 실패',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: '대기 중',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${statusInfo.bgColor} ${statusInfo.color}`}>
      {statusInfo.icon}
      <span>{statusInfo.text}</span>
      {lastSaved && status === 'saved' && (
        <span className="text-xs opacity-75">
          ({lastSaved.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })})
        </span>
      )}
    </div>
  );
}
