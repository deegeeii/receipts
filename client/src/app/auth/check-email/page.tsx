export default function CheckEmailPage() {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
  
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            Check your email
          </h2>
  
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            We sent a link to your inbox.
            <br />
            Click it to get in.
          </p>
  
          <p className="text-xs text-[#6B6B6B]">
            Wrong email?{" "}
            <a href="/auth/email" className="text-[#C9A84C] hover:underline">
              Try again
            </a>
          </p>
  
        </div>
      </main>
    );
  }
  