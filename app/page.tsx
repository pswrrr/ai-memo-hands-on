import Image from "next/image";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import LogoutButton from "@/components/auth/LogoutButton";

// 페이지를 dynamic으로 설정하여 매번 새로 렌더링
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  // 서버 사이드에서 세션 확인
  const supabase = await createServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  
  const user = session?.user;

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI 메모장
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            음성과 텍스트로 편리하게 메모하고, AI가 자동으로 요약해드립니다
          </p>
          {user && (
            <p className="text-sm text-gray-500">
              환영합니다, {user.email}님!
            </p>
          )}
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              >
                대시보드
              </Link>
              <LogoutButton variant="outline" />
            </>
          ) : (
            <>
              <Link
                href="/auth/signup"
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              >
                회원가입
              </Link>
              <Link
                href="/auth/login"
                className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
              >
                로그인
              </Link>
            </>
          )}
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}