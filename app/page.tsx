import Image from "next/image";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import LogoutButton from "@/components/auth/LogoutButton";

// ?�이지�?dynamic?�로 ?�정?�여 매번 ?�로 ?�더�?export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  
  // ?�버 ?�이?�에???�션 ?�인
  const supabase = await createServerSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  
  const user = session?.user;

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI 메모??          </h1>
          <p className="text-lg text-gray-600 mb-8">
            ?�성�??�스?�로 ?�리?�게 메모?�고, AI가 ?�동?�로 ?�약?�드립니??          </p>
          {user && (
            <p className="text-sm text-gray-500">
              ?�영?�니?? {user.email}??
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
                ?�?�보??              </Link>
              <LogoutButton variant="outline" />
            </>
          ) : (
            <>
              <Link
                href="/auth/signup"
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              >
                ?�원가??              </Link>
              <Link
                href="/auth/login"
                className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
              >
                로그??              </Link>
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
          Go to nextjs.org ??        </a>
      </footer>
    </div>
  );
}
