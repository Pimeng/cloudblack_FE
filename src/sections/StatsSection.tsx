import { useRef, useEffect, useState } from 'react';
import { FileCheck, Users, TrendingUp, Clock } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const API_BASE = 'https://cloudblack-api.07210700.xyz';

interface StatisticsData {
  processed_appeals: number;
  blacklist_count: number;
  success_rate: number;
  avg_processing_hours: number;
}

function AnimatedNumber({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: numberRef.current,
      start: 'top 80%',
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: value,
          duration: 2,
          ease: 'expo.out',
          onUpdate: function() {
            setDisplayValue(this.targets()[0].val);
          }
        });
      },
      once: true
    });

    return () => trigger.kill();
  }, [value]);

  const formatValue = (val: number) => {
    if (decimals > 0) {
      return val.toFixed(decimals);
    }
    return Math.floor(val).toLocaleString();
  };

  return (
    <span ref={numberRef} className="tabular-nums">
      {formatValue(displayValue)}{suffix}
    </span>
  );
}

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取统计数据
    const fetchStatistics = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/statistics`);
        const data = await response.json();
        if (data.success) {
          setStatistics(data.data);
        }
      } catch (err) {
        console.error('获取统计数据失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const stats = [
    {
      icon: FileCheck,
      label: '已处理申诉',
      value: statistics?.processed_appeals ?? 0,
      suffix: '',
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      icon: Users,
      label: '黑名单用户',
      value: statistics?.blacklist_count ?? 0,
      suffix: '',
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      icon: TrendingUp,
      label: '申诉成功率',
      value: statistics?.success_rate ?? 0,
      suffix: '%',
      decimals: 1,
      color: 'from-green-500/20 to-emerald-500/20',
    },
    {
      icon: Clock,
      label: '平均处理时间',
      value: statistics?.avg_processing_hours ?? 0,
      suffix: 'h',
      decimals: 1,
      color: 'from-orange-500/20 to-yellow-500/20',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Grid flip entrance
      const gridTrigger = ScrollTrigger.create({
        trigger: gridRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo(gridRef.current,
            { rotateX: 90, opacity: 0 },
            { rotateX: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
          );
        },
        once: true
      });
      triggersRef.current.push(gridTrigger);
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
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
          数据统计
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          实时更新的平台数据，透明公开的服务记录
        </p>
      </div>

      {/* Stats grid */}
      <div 
        ref={gridRef}
        className="max-w-4xl mx-auto"
        style={{ perspective: '1000px' }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative"
            >
              <div className={`glass rounded-2xl p-6 h-full bg-gradient-to-br ${stat.color} hover:shadow-glow transition-all duration-500`}>
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                  <stat.icon className="w-5 h-5 text-white/80" />
                </div>
                
                {/* Value */}
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {loading ? (
                    <span className="text-white/40">--</span>
                  ) : (
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} decimals={(stat as any).decimals} />
                  )}
                </div>
                
                {/* Label */}
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
              
              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-br ${stat.color} rounded-2xl blur-xl -z-10 opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
