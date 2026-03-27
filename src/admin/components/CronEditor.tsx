import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CronEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

type CronTab = 'minute' | 'hour' | 'day' | 'month' | 'week';
type CronMode = 'every' | 'range' | 'interval' | 'specific';

interface CronPartState {
  mode: CronMode;
  values: number[];
  rangeStart: number;
  rangeEnd: number;
  intervalStart: number;
  intervalStep: number;
}

const defaultPartState = (min: number, max: number): CronPartState => ({
  mode: 'every',
  values: [],
  rangeStart: min,
  rangeEnd: max,
  intervalStart: min,
  intervalStep: 1,
});

// 解析 Cron 表达式到状态
const parseCronToState = (cron: string): Record<CronTab, CronPartState> => {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      minute: defaultPartState(0, 59),
      hour: defaultPartState(0, 23),
      day: defaultPartState(1, 31),
      month: defaultPartState(1, 12),
      week: defaultPartState(0, 6),
    };
  }

  const parsePart = (part: string, min: number, max: number): CronPartState => {
    const state = defaultPartState(min, max);
    
    if (part === '*') {
      state.mode = 'every';
    } else if (part.includes('/')) {
      const [base, step] = part.split('/');
      state.mode = 'interval';
      state.intervalStart = base === '*' ? min : parseInt(base) || min;
      state.intervalStep = parseInt(step) || 1;
    } else if (part.includes('-')) {
      const [start, end] = part.split('-');
      state.mode = 'range';
      state.rangeStart = parseInt(start) || min;
      state.rangeEnd = parseInt(end) || max;
    } else if (part.includes(',')) {
      state.mode = 'specific';
      state.values = part.split(',').map(v => parseInt(v)).filter(v => !isNaN(v));
    } else {
      const val = parseInt(part);
      if (!isNaN(val)) {
        state.mode = 'specific';
        state.values = [val];
      }
    }
    
    return state;
  };

  return {
    minute: parsePart(parts[0], 0, 59),
    hour: parsePart(parts[1], 0, 23),
    day: parsePart(parts[2], 1, 31),
    month: parsePart(parts[3], 1, 12),
    week: parsePart(parts[4], 0, 6),
  };
};

// 将状态转换为 Cron 表达式
const stateToCron = (states: Record<CronTab, CronPartState>): string => {
  const partToString = (state: CronPartState, min: number): string => {
    switch (state.mode) {
      case 'every':
        return '*';
      case 'range':
        return `${state.rangeStart}-${state.rangeEnd}`;
      case 'interval':
        return state.intervalStart === min 
          ? `*/${state.intervalStep}` 
          : `${state.intervalStart}/${state.intervalStep}`;
      case 'specific':
        return state.values.length > 0 ? state.values.join(',') : '*';
      default:
        return '*';
    }
  };

  return [
    partToString(states.minute, 0),
    partToString(states.hour, 0),
    partToString(states.day, 1),
    partToString(states.month, 1),
    partToString(states.week, 0),
  ].join(' ');
};

// 计算下次执行时间
const getNextExecutions = (cronExpr: string, count: number = 5): Date[] => {
  if (!cronExpr) return [];
  
  try {
    const executions: Date[] = [];
    const now = new Date();
    
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) return [];
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    const parseValue = (part: string, min: number, max: number): number[] => {
      if (part === '*') {
        const result: number[] = [];
        for (let i = min; i <= max; i++) result.push(i);
        return result;
      }
      if (part.includes('/')) {
        const [, step] = part.split('/');
        const result: number[] = [];
        for (let i = min; i <= max; i += parseInt(step)) result.push(i);
        return result;
      }
      if (part.includes('-')) {
        const [start, end] = part.split('-');
        const result: number[] = [];
        for (let i = parseInt(start) || min; i <= (parseInt(end) || max); i++) result.push(i);
        return result;
      }
      return part.split(',').map(v => parseInt(v)).filter(v => !isNaN(v));
    };
    
    const minutes = parseValue(minute, 0, 59);
    const hours = parseValue(hour, 0, 23);
    const daysOfMonth = parseValue(dayOfMonth, 1, 31);
    const months = parseValue(month, 1, 12);
    const daysOfWeek = parseValue(dayOfWeek, 0, 6);
    
    for (let dayOffset = 0; dayOffset < 365 && executions.length < count; dayOffset++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      checkDate.setHours(0, 0, 0, 0);
      
      const currentMonth = checkDate.getMonth() + 1;
      const currentDayOfMonth = checkDate.getDate();
      const currentDayOfWeek = checkDate.getDay();
      
      if (!months.includes(currentMonth)) continue;
      
      const domMatch = dayOfMonth === '*' || daysOfMonth.includes(currentDayOfMonth);
      const dowMatch = dayOfWeek === '*' || daysOfWeek.includes(currentDayOfWeek);
      if (!domMatch || !dowMatch) continue;
      
      for (const h of hours) {
        for (const m of minutes) {
          const execTime = new Date(checkDate);
          execTime.setHours(h, m, 0, 0);
          
          if (execTime > now && executions.length < count) {
            executions.push(execTime);
          }
        }
      }
    }
    
    return executions.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
  } catch {
    return [];
  }
};

const tabLabels: Record<CronTab, string> = {
  minute: '分',
  hour: '时',
  day: '日',
  month: '月',
  week: '周',
};

const tabRanges: Record<CronTab, { min: number; max: number }> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  day: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  week: { min: 0, max: 6 },
};

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function CronEditor({ value, onChange, disabled }: CronEditorProps) {
  const [activeTab, setActiveTab] = useState<CronTab>('minute');
  const [states, setStates] = useState<Record<CronTab, CronPartState>>(() => parseCronToState(value));

  useEffect(() => {
    setStates(parseCronToState(value));
  }, [value]);

  const updateState = (tab: CronTab, updates: Partial<CronPartState>) => {
    const newStates = { ...states, [tab]: { ...states[tab], ...updates } };
    setStates(newStates);
    onChange(stateToCron(newStates));
  };

  const renderTabContent = (tab: CronTab) => {
    const state = states[tab];
    const { min, max } = tabRanges[tab];

    return (
      <div className="space-y-4">
        {/* 模式选择 */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${tab}-mode`}
              checked={state.mode === 'every'}
              onChange={() => updateState(tab, { mode: 'every' })}
              disabled={disabled}
              className="w-4 h-4"
            />
            <span className="text-sm">每{tabLabels[tab]}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${tab}-mode`}
              checked={state.mode === 'range'}
              onChange={() => updateState(tab, { mode: 'range' })}
              disabled={disabled}
              className="w-4 h-4"
            />
            <span className="text-sm">周期</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${tab}-mode`}
              checked={state.mode === 'interval'}
              onChange={() => updateState(tab, { mode: 'interval' })}
              disabled={disabled}
              className="w-4 h-4"
            />
            <span className="text-sm">间隔</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${tab}-mode`}
              checked={state.mode === 'specific'}
              onChange={() => updateState(tab, { mode: 'specific' })}
              disabled={disabled}
              className="w-4 h-4"
            />
            <span className="text-sm">指定</span>
          </label>
        </div>

        {/* 根据模式显示不同输入 */}
        {state.mode === 'range' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">从</span>
            <Input
              type="number"
              min={min}
              max={max}
              value={state.rangeStart}
              onChange={(e) => updateState(tab, { rangeStart: parseInt(e.target.value) || min })}
              disabled={disabled}
              className="w-20 bg-muted border-border"
            />
            <span className="text-sm text-muted-foreground">到</span>
            <Input
              type="number"
              min={min}
              max={max}
              value={state.rangeEnd}
              onChange={(e) => updateState(tab, { rangeEnd: parseInt(e.target.value) || max })}
              disabled={disabled}
              className="w-20 bg-muted border-border"
            />
            <span className="text-sm text-muted-foreground">{tabLabels[tab]}</span>
          </div>
        )}

        {state.mode === 'interval' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">从第</span>
            <Input
              type="number"
              min={min}
              max={max}
              value={state.intervalStart}
              onChange={(e) => updateState(tab, { intervalStart: parseInt(e.target.value) || min })}
              disabled={disabled}
              className="w-20 bg-muted border-border"
            />
            <span className="text-sm text-muted-foreground">{tabLabels[tab]}开始，每</span>
            <Input
              type="number"
              min={1}
              max={max - min + 1}
              value={state.intervalStep}
              onChange={(e) => updateState(tab, { intervalStep: parseInt(e.target.value) || 1 })}
              disabled={disabled}
              className="w-20 bg-muted border-border"
            />
            <span className="text-sm text-muted-foreground">{tabLabels[tab]}执行一次</span>
          </div>
        )}

        {state.mode === 'specific' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">选择指定的{tabLabels[tab]}：</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    const newValues = state.values.includes(val)
                      ? state.values.filter(v => v !== val)
                      : [...state.values, val].sort((a, b) => a - b);
                    updateState(tab, { values: newValues });
                  }}
                  disabled={disabled}
                  className={`w-10 h-8 rounded text-xs transition-colors ${
                    state.values.includes(val)
                      ? 'bg-brand text-white'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {tab === 'week' ? weekDays[val]?.slice(0, 2) : val}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const nextExecutions = getNextExecutions(value, 5);

  return (
    <div className="space-y-4">
      {/* 标签页 */}
      <div className="flex border-b border-border">
        {(Object.keys(tabLabels) as CronTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-brand border-brand'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* 当前标签内容 */}
      <div className="py-2">
        {renderTabContent(activeTab)}
      </div>

      {/* Cron 表达式显示 */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Label>Cron 表达式</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="bg-muted border-border font-mono"
          placeholder="0 3 * * *"
        />
      </div>

      {/* 下次执行时间 */}
      {nextExecutions.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">预计下次执行时间：</p>
          <ul className="space-y-1">
            {nextExecutions.map((date, idx) => (
              <li key={idx} className="text-xs text-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand/20 text-brand flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                {date.toLocaleString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
