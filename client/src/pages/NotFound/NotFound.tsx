import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold">404</h1>
      <p>页面不存在</p>
      <Link className="text-primary underline" to="/">返回工具箱</Link>
    </main>
  );
}
