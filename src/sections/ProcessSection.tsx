import { useRef, useEffect } from 'react';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title glitch effect
      const titleTrigger = ScrollTrigger.create({
        trigger: titleRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo(titleRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'steps(10)' }
          );
        },
        once: true
      });
      triggersRef.current.push(titleTrigger);

      // Line drawing animation
      if (lineRef.current) {
        const length = lineRef.current.getTotalLength();
        gsap.set(lineRef.current, {
          strokeDasharray: length,
          strokeDashoffset: length
        });
        
        const lineTrigger = ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 60%',
          end: 'bottom 80%',
          scrub: 1,
          onUpdate: (self) => {
            gsap.set(lineRef.current, {
              strokeDashoffset: length * (1 - self.progress)
            });
          }
        });
        triggersRef.current.push(lineTrigger);
      }

      // Steps animation
      stepsRef.current.forEach((step, index) => {
        if (!step) return;
        
        const xOffset = steps[index].side === 'left' ? -50 : 50;
        
        const stepTrigger = ScrollTrigger.create({
          trigger: step,
          start: 'top 80%',
          onEnter: () => {
            gsap.fromTo(step,
              { x: xOffset, opacity: 0 },
              { 
                x: 0, 
                opacity: 1, 
                duration: 0.8, 
                delay: index * 0.2,
                ease: 'power2.out' 
              }
            );
            
            // Animate node glow
            const node = step.querySelector('.step-node');
            if (node) {
              gsap.fromTo(node,
                { scale: 0 },
                { 
                  scale: 1, 
                  duration: 0.5, 
                  delay: index * 0.2 + 0.3,
                  ease: 'elastic.out(1, 0.5)' 
                }
              );
            }
          },
          once: true
        });
        triggersRef.current.push(stepTrigger);
      });
    }, sectionRef);

    return () => {
      triggersRef.current.forEach(trigger => trigger.kill());
      triggersRef.current = [];
      ctx.revert();
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 px-4 overflow-hidden"
    >
      {/* Section title */}
      <h2 
        ref={titleRef}
        className="text-3xl md:text-4xl font-bold text-center text-gradient mb-20"
      >
        申诉流程
      </h2>

      {/* Timeline container */}
      <div className="max-w-4xl mx-auto relative">
        {/* SVG Line */}
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

        {/* Steps */}
        <div className="space-y-16 md:space-y-24">
          {steps.map((step, index) => (
            <div
              key={step.title}
              ref={el => { stepsRef.current[index] = el; }}
              className={`relative flex items-center ${
                step.side === 'left' 
                  ? 'md:flex-row flex-col' 
                  : 'md:flex-row-reverse flex-col'
              }`}
            >
              {/* Content card */}
              <div className={`w-full md:w-5/12 ${
                step.side === 'left' ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'
              }`}>
                <div className="glass rounded-2xl p-6 hover:shadow-glow transition-shadow duration-500">
                  <div className={`flex items-center gap-4 mb-4 ${
                    step.side === 'left' ? 'md:flex-row-reverse' : ''
                  }`}>
                    <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-brand" />
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Center node */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
                <div className="step-node relative">
                  <div className="w-6 h-6 rounded-full bg-brand animate-pulse-glow" />
                  <div className="absolute inset-0 w-6 h-6 rounded-full bg-brand/50 animate-ping" />
                </div>
              </div>

              {/* Empty space for alternating layout */}
              <div className="hidden md:block w-5/12" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
