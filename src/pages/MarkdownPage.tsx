import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ArrowLeft, FileText, Shield, Gavel, WrapText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FluidBackground } from '@/components/FluidBackground';
import 'highlight.js/styles/github-dark.css';

const markdownFiles: Record<string, { title: string; path: string; icon: React.ReactNode }> = {
  'admin-rules': {
    title: '管理准则',
    path: '/皮梦の云黑 管理准则.md',
    icon: <Shield className="w-5 h-5" />,
  },
  'review-rules': {
    title: '审核准则',
    path: '/皮梦の云黑 审核准则.md',
    icon: <Gavel className="w-5 h-5" />,
  },
};

export function MarkdownPage() {
  const { fileKey } = useParams<{ fileKey: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fileInfo = fileKey ? markdownFiles[fileKey] : null;
  const codeWrapStateRef = useRef<Record<string, boolean>>({});
  const [, forceUpdate] = useState({});
  const gotoPath = searchParams.get('goto');

  useEffect(() => {
    if (!fileInfo) {
      setError('未找到指定的文档');
      setLoading(false);
      return;
    }

    fetch(fileInfo.path)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ${fileInfo.path}`);
        }
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || '加载文档失败');
        setLoading(false);
      });
  }, [fileInfo]);

  const handleBack = () => {
    navigate(gotoPath || '/');
  };

  if (!fileInfo) {
    return (
      <div className="relative min-h-screen">
        <FluidBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">文档未找到</h1>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <FluidBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="mx-auto md:max-w-4xl px-4 h-14 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">返回</span>
            </button>
            
            <div className="flex items-center gap-2 text-foreground">
              {fileInfo.icon}
              <h1 className="font-semibold">{fileInfo.title}</h1>
            </div>
            
            <div className="w-16" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col px-0 md:px-4 overflow-hidden">
          <div className="flex-1 flex flex-col mx-auto md:max-w-4xl w-full min-w-0">
            <div className="flex-1 md:bg-card/80 bg-transparent md:backdrop-blur-sm border-0 md:border border-transparent md:border-border rounded-none md:rounded-xl overflow-hidden md:shadow-lg min-w-0">
              <ScrollArea className="h-full w-full [&>[data-slot=scroll-area-viewport]]:min-w-0 [&>[data-slot=scroll-area-viewport]>div]:!block [&>[data-slot=scroll-area-viewport]>div]:w-full [&>[data-slot=scroll-area-viewport]>div]:min-w-0 [&>[data-slot=scroll-area-viewport]>div]:bg-background md:[&>[data-slot=scroll-area-viewport]>div]:bg-transparent">
                <div className="px-4 pt-8 md:p-8 pb-8">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-destructive">{error}</p>
                    </div>
                  ) : (
                    <article className="max-w-full w-full overflow-x-hidden min-w-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border leading-tight break-all">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 sm:mt-8 mb-3 sm:mb-4 leading-tight break-all">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mt-4 sm:mt-6 mb-2 sm:mb-3 leading-tight break-all">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-sm sm:text-base text-muted-foreground leading-7 sm:leading-relaxed mb-4 break-all">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 sm:pl-5 text-muted-foreground space-y-2 sm:space-y-2 mb-4 text-sm sm:text-base">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 sm:pl-5 text-muted-foreground space-y-2 sm:space-y-2 mb-4 text-sm sm:text-base">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-7 sm:leading-relaxed pl-1">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-brand pl-3 sm:pl-4 italic text-muted-foreground my-4 text-sm sm:text-base">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children, className, node }) => {
                            const isInline = !className;
                            const codeId = node?.position?.start?.offset?.toString() || 'inline-code';
                            const isWrapEnabled = codeWrapStateRef.current[codeId] || false;
                            
                            // Split code into lines for line numbers
                            const codeString = String(children);
                            const lines = codeString.split('\n').filter((_, i, arr) => !(i === arr.length - 1 && arr[i] === ''));
                            
                            const toggleWrap = () => {
                              codeWrapStateRef.current = { 
                                ...codeWrapStateRef.current, 
                                [codeId]: !codeWrapStateRef.current[codeId] 
                              };
                              forceUpdate({}); // Re-render to apply changes
                            };
                            
                            return isInline ? (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                                {children}
                              </code>
                            ) : (
                              <div className="my-4" data-code-id={codeId}>
                                {/* Toolbar */}
                                <div className="bg-muted/80 border-b border-border sm:rounded-t-lg px-3 py-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-mono text-[10px] bg-muted-foreground/10 px-1.5 py-0.5 rounded">
                                      {lines.length}L
                                    </span>
                                  </div>
                                  <button
                                    onClick={toggleWrap}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                                      isWrapEnabled 
                                        ? 'bg-brand/20 text-brand' 
                                        : 'hover:bg-muted-foreground/10 text-muted-foreground'
                                    }`}
                                    title={isWrapEnabled ? '关闭自动换行' : '开启自动换行'}
                                  >
                                    <WrapText className="w-3.5 h-3.5" />
                                    <span>{isWrapEnabled ? '已换行' : '换行'}</span>
                                  </button>
                                </div>
                                {/* Code block */}
                                <div 
                                  className={`bg-muted sm:rounded-b-lg overflow-x-auto ${isWrapEnabled ? 'overflow-x-hidden' : ''}`}
                                >
                                  <div className="flex">
                                    {/* Line numbers */}
                                    <div className="select-none border-r border-border/50 bg-muted/50 py-3 sm:py-4 px-2 sm:px-3 text-right">
                                      {lines.map((_, i) => (
                                        <div key={i} className="text-[10px] sm:text-xs text-muted-foreground/50 font-mono leading-5 w-4 sm:w-6">
                                          {i + 1}
                                        </div>
                                      ))}
                                    </div>
                                    {/* Code content */}
                                    <pre className="p-3 sm:p-4 m-0 flex-1 overflow-visible" style={{ minWidth: isWrapEnabled ? 'auto' : 'max-content' }}>
                                      <code className={`${className} text-sm font-mono block leading-5 ${
                                        isWrapEnabled ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
                                      }`}>{children}</code>
                                    </pre>
                                  </div>
                                </div>
                                {!isWrapEnabled && (
                                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center sm:hidden">
                                    ← 左右滑动查看，或点击「换行」按钮 →
                                  </p>
                                )}
                              </div>
                            );
                          },
                          table: ({ children }) => (
                            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 my-4">
                              <table className="w-full border-collapse border border-border text-sm sm:text-base">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-muted">{children}</thead>
                          ),
                          th: ({ children }) => (
                            <th className="border border-border px-2 sm:px-4 py-2 text-left font-semibold text-foreground whitespace-nowrap sm:whitespace-normal">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-border px-2 sm:px-4 py-2 text-muted-foreground">
                              {children}
                            </td>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              className="text-brand hover:underline break-all"
                              target={href?.startsWith('http') ? '_blank' : undefined}
                              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                            >
                              {children}
                            </a>
                          ),
                          hr: () => <hr className="border-border my-4 sm:my-6" />,
                        }}
                      >
                        {content}
                      </ReactMarkdown>
                    </article>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
