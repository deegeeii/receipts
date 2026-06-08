// EmailLoginPage — magic link request form
export default function EmailLoginPage() {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <div className="w-full max-w-sm flex flex-col gap-8">
  
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-[#F0EDEA]">
              Continue with email
            </h2>
            <p className="text-sm text-[#6B6B6B]">
              We&apos;ll send you a magic link.
            </p>
          </div>
  
          <form action="/auth/magic-link" method="POST" className="flex flex-col gap-4">
            {/* Email field — labeled for accessibility */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-xs text-[#6B6B6B] uppercase tracking-wide"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] transition-colors"
            >
              Send link
            </button>
          </form>
  
          <a
            href="/auth/login"
            className="text-center text-xs text-[#6B6B6B] hover:text-[#C9A84C] transition-colors"
          >
            ← Back
          </a>
  
        </div>
      </main>
    );
  }
  