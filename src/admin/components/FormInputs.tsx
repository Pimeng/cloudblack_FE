import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  containerClassName?: string;
  inputClassName?: string;
  hint?: string;
}

export function FormInput({
  label,
  containerClassName,
  inputClassName,
  hint,
  id,
  ...props
}: FormInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <Input
        id={inputId}
        className={cn('bg-slate-800 border-slate-700', inputClassName)}
        {...props}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  containerClassName?: string;
  selectClassName?: string;
  options: { value: string; label: string }[];
  hint?: string;
}

export function FormSelect({
  label,
  containerClassName,
  selectClassName,
  options,
  hint,
  id,
  ...props
}: FormSelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && <Label htmlFor={selectId}>{label}</Label>}
      <select
        id={selectId}
        className={cn(
          "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white",
          selectClassName
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  containerClassName?: string;
  textareaClassName?: string;
  hint?: string;
}

export function FormTextarea({
  label,
  containerClassName,
  textareaClassName,
  hint,
  id,
  ...props
}: FormTextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && <Label htmlFor={textareaId}>{label}</Label>}
      <textarea
        id={textareaId}
        className={cn(
          'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white resize-none',
          textareaClassName
        )}
        {...props}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Boolean 选择器（是/否，启用/禁用）
interface FormBooleanSelectProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  containerClassName?: string;
  trueLabel?: string;
  falseLabel?: string;
  disabled?: boolean;
}

export function FormBooleanSelect({
  label,
  value,
  onChange,
  containerClassName,
  trueLabel = '启用',
  falseLabel = '禁用',
  disabled = false,
}: FormBooleanSelectProps) {
  return (
    <div className={cn('space-y-2', containerClassName)}>
      <Label>{label}</Label>
      <select
        value={value ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value === 'true')}
        disabled={disabled}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-50"
      >
        <option value="true">{trueLabel}</option>
        <option value="false">{falseLabel}</option>
      </select>
    </div>
  );
}
