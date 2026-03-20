import { useRef, useEffect } from 'react';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';

const steps = [
  {
    icon: FileText,
    title: '提交申诉',
    description: '填写申诉表单，详细说明情况，提供相关证据截图，提交申诉请求。',
    side: 'left',
  },
  {
    icon: Clock,
    title: '等待审核',
    description: '工作人员会在24小时内进行审核，请耐心等待处理结果。',
    side: 'right',
  },
  {
    icon: CheckCircle,
    title: '处理结果',
    description: '审核通过后，将从黑名单中移除您的账号，并发送通知邮件。',
    side: 'left',
  },
];

interface ProcessSectionProps {
  active?: boolean;
}

export function ProcessSection({ active }: ProcessSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current) return;
    hasAnimated.current = true;

    // Title
    gsap.fromTo(titleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'steps(10)' }
    );

    // SVG line draw
    if (lineRef.current) {
      const length = lineRef.current.getTotalLength();
      gsap.fromTo(lineRef.current,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', delay: 0.3 }
      );
    }

    // Steps
    stepsRef.current.forEach((step, index) => {
      if (!step) return;
      const xOffset = steps[index].side === 'left' ? -50 : 50;
      gsap.fromTo(step,
        { x: xOffset, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, delay: 0.2 + index * 0.2, ease: 'power2.out' }
      );
      const node = step.querySelector('.step-node');
      if (node) {
        gsap.fromTo(node,
          { scale: 0 },
          { scale: 1, duration: 0.5, delay: 0.4 + index * 0.2, ease: 'elastic.out(1, 0.5)' }
        );
      }
    });
  }, [active]);

  return (
    <section ref={sectionRef} className="relative py-10 px-4 overflow-hidden h-screen flex flex-col justify-center">
      <h2
        ref={titleRef}
        className="text-3xl md:text-4xl font-bold text-center text-gradient mb-8"
        style={{ opacity: 0 }}
      >
        申诉流程
      </h2>

      <div className="max-w-3xl mx-auto relative w-full">
        <svg
          className="absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 hidden md:block"
          preserveAspectRatio="none"
          viewBox="0 0 16 100"
        >
          <path
            ref={lineRef}
            d="M 8 0 L 8 100"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.75 0.14 250)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="oklch(0.75 0.14 250)" stopOpacity="1" />
              <stop offset="100%" stopColor="oklch(0.75 0.14 250)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              ref={el => { stepsRef.current[index] = el; }}
              className={`relative flex items-center gap-4 ${step.side === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`}
              style={{ opacity: 0 }}
            >
              {/* Card */}
              <div className={`flex-1 min-w-0 ${step.side === 'left' ? 'md:text-right md:pr-10' : 'md:text-left md:pl-10'}`}>
                <div className="glass rounded-2xl p-5 hover:shadow-glow transition-shadow duration-500">
                  <div className={`flex items-center gap-3 mb-3 ${step.side === 'left' ? 'md:flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-5 h-5 text-brand" />
                    </div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>

              {/* Center node — visible on all sizes */}
              <div className="flex-shrink-0 flex items-center justify-center w-8">
                <div className="step-node relative" style={{ scale: '0' }}>
                  <div className="w-5 h-5 rounded-full bg-brand animate-pulse-glow" />
                  <div className="absolute inset-0 w-5 h-5 rounded-full bg-brand/50 animate-ping" />
                </div>
              </div>

              {/* Empty spacer for alternating layout on desktop */}
              <div className="hidden md:block flex-1" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
