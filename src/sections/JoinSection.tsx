import { Mail, Sparkles } from 'lucide-react';

interface JoinSectionProps {
  active?: boolean;
}

export function JoinSection({ active }: JoinSectionProps) {
  return (
    <section className="relative h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-24 left-10 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
        <div
          className="absolute bottom-20 right-12 h-56 w-56 rounded-full bg-brand/5 blur-3xl"
          style={{ opacity: active ? 1 : 0.7 }}
        />
      </div>

      <div className="relative w-full max-w-3xl">
        <div className="glass-strong rounded-3xl border border-border/40 p-8 md:p-12 shadow-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm text-brand">
            <Sparkles className="h-4 w-4" />
            加入我们
          </div>

          <h2 className="text-3xl font-bold text-gradient md:text-5xl">欢迎一起参与项目内测</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            如果你对这个项目感兴趣，欢迎联系我们；我们目前采取邀请制，等内测完毕后，将进行公测；预计将于 2026 中旬之前对大众开放噢！
          </p>

          <a
            href="mailto:i@pmya.xyz"
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-brand px-6 py-4 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-brand-dark hover:shadow-glow"
          >
            <Mail className="h-5 w-5" />
            i@pmya.xyz
          </a>
        </div>
      </div>
    </section>
  );
}
