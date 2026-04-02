import { useRef, useLayoutEffect } from 'react';
import { Search, MessageSquare, Scale } from 'lucide-react';
import { gsap } from 'gsap';

const features = [
  {
    icon: Search,
    title: '查询黑名单',
    description: '快速查询用户是否在黑名单中，获取详细的封禁信息和原因。',
    rotation: -5,
    zIndex: 0,
  },
  {
    icon: MessageSquare,
    title: '申诉解封',
    description: '提供便捷的申诉渠道，详细说明情况，等待管理员审核处理。',
    rotation: 0,
    zIndex: 50,
  },
  {
    icon: Scale,
    title: '公平公正',
    description: '所有封禁记录透明公开，申诉流程公正合理，保障用户权益。',
    rotation: 5,
    zIndex: 100,
  },
];

interface FeaturesSectionProps {
  active?: boolean;
}

export function FeaturesSection({ active }: FeaturesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useLayoutEffect(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      if (!active) {
        gsap.set(cards, {
          opacity: 1,
          z: 0,
          rotateY: 0,
          rotateX: 0,
          translateZ: 0,
        });
        gsap.set('.feature-icon', { rotation: 0, scale: 1 });
        return;
      }

      if (hasAnimated.current) return;
      hasAnimated.current = true;

      cards.forEach((card, index) => {
        gsap.fromTo(card,
          { z: -500, opacity: 0, rotateY: -30 },
          {
            z: 0,
            opacity: 1,
            rotateY: 0,
            duration: 1,
            delay: index * 0.2,
            ease: 'elastic.out(1, 0.5)',
            overwrite: 'auto',
          }
        );

        const icon = card.querySelector('.feature-icon');
        if (icon) {
          gsap.fromTo(icon,
            { rotation: -180, scale: 0 },
            {
              rotation: 0,
              scale: 1,
              duration: 0.6,
              delay: index * 0.2 + 0.3,
              ease: 'elastic.out(1, 0.5)',
              overwrite: 'auto',
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [active]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const rotateX = (e.clientY - rect.top - rect.height / 2) / 10;
    const rotateY = (rect.left + rect.width / 2 - e.clientX) / 10;
    gsap.to(card, { rotateX: -rotateX, rotateY: -rotateY, translateZ: 30, duration: 0.3, ease: 'power2.out' });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;
    gsap.to(card, { rotateX: 0, rotateY: 0, translateZ: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-10 px-4 overflow-hidden h-screen flex flex-col justify-center"
      style={{ perspective: '1000px' }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">为什么选择我们</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          提供完善的黑名单查询与申诉服务，让社区管理更加透明高效
        </p>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              ref={el => { cardsRef.current[index] = el; }}
              className="relative group"
              style={{
                transformStyle: 'preserve-3d',
                opacity: 1,
              }}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              {/* Mobile card */}
              <div className="md:hidden glass rounded-2xl p-5 hover:shadow-glow transition-shadow duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="feature-icon w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-brand" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>

              {/* Desktop card */}
              <div className="hidden md:block glass rounded-2xl p-8 h-full transition-shadow duration-300 group-hover:shadow-glow"
                style={{ transform: `rotateZ(${feature.rotation}deg) translateZ(${feature.zIndex}px)` }}>
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 0.8s ease-out, opacity 0.3s' }} />
                </div>
                <div className="feature-icon w-16 h-16 rounded-xl bg-brand/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
              <div className="absolute -inset-1 bg-brand/20 rounded-2xl blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
