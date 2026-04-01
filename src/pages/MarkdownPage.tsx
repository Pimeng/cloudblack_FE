import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ArrowLeft, FileText, Shield, Gavel } from 'lucide-react';
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
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fileInfo = fileKey ? markdownFiles[fileKey] : null;

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
    navigate('/');
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
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
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
        <main className="flex-1 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-6 md:p-8">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-destructive">{error}</p>
                    </div>
                  ) : (
                    <article className="max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-3xl font-bold text-foreground mb-6 pb-4 border-b border-border">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-muted-foreground leading-relaxed mb-4">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-relaxed">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-brand pl-4 italic text-muted-foreground my-4">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-4">
                                <code className={className}>{children}</code>
                              </pre>
                            );
                          },
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4">
                              <table className="w-full border-collapse border border-border">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-muted">{children}</thead>
                          ),
                          th: ({ children }) => (
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-border px-4 py-2 text-muted-foreground">
                              {children}
                            </td>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              className="text-brand hover:underline"
                              target={href?.startsWith('http') ? '_blank' : undefined}
                              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                            >
                              {children}
                            </a>
                          ),
                          hr: () => <hr className="border-border my-6" />,
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
