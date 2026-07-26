import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '@/lib/safe-logger';

interface Props {
  children: ReactNode;
  toolName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ToolErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error(`[ToolErrorBoundary] ${this.props.toolName ?? 'unknown'}:`, { error: error, arg1: info.componentStack });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center py-8 px-4 text-sm text-destructive gap-2"
        >
          <span className="font-medium">工具执行异常</span>
          <span className="text-xs text-muted-foreground font-mono max-w-md text-center break-all">
            {this.state.error?.message ?? '未知错误'}
          </span>
          <button
            className="mt-2 text-xs underline text-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ToolErrorBoundary;
