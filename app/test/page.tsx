import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  FileText, 
  Settings, 
  UserCheck, 
  Wrench,
  ArrowRight 
} from 'lucide-react';

export default function TestPage() {
  const testPages = [
    {
      title: '온보딩 테스트',
      description: '온보딩 플로우를 독립적으로 테스트할 수 있습니다.',
      href: '/test/onboarding',
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: '데이터베이스 테스트',
      description: '데이터베이스 연결 및 쿼리를 테스트합니다.',
      href: '/test/database',
      icon: Database,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: '마크다운 에디터',
      description: '마크다운 에디터 기능을 테스트합니다.',
      href: '/test/markdown-editor',
      icon: FileText,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: '리치 텍스트 에디터',
      description: '리치 텍스트 에디터 기능을 테스트합니다.',
      href: '/test/rich-text-editor',
      icon: Settings,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: '고급 도구',
      description: '고급 편집 도구들을 테스트합니다.',
      href: '/test/advanced-tools',
      icon: Wrench,
      color: 'bg-red-50 text-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">테스트 페이지</h1>
          <p className="text-gray-600">
            AI 메모장의 각 기능을 독립적으로 테스트할 수 있는 페이지들입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testPages.map((page) => {
            const IconComponent = page.icon;
            return (
              <Card key={page.href} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${page.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                  </div>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={page.href}>
                    <Button className="w-full" variant="outline">
                      테스트 시작
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h3>
          <p className="text-sm text-yellow-800">
            이 테스트 페이지들은 개발 및 디버깅 목적으로만 사용됩니다. 
            프로덕션 환경에서는 접근할 수 없도록 설정되어야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
