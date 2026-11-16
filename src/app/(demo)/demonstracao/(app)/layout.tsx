import { DemoAuthGuard } from "@/features/demo-auth/demo-auth-guard";
import { DemoDatasetIssueBanner } from "@/features/demo-auth/demo-dataset-issue-banner";
import { DemoErrorBoundary } from "@/features/demo-auth/demo-error-boundary";
import { DemoSidebar, DemoTopBar } from "@/components/layout/demo-shell";

export default function DemoAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoAuthGuard>
      <DemoErrorBoundary>
        <div className="flex min-h-screen bg-muted">
          <DemoSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DemoTopBar />
            <DemoDatasetIssueBanner />
            <main id="conteudo-principal" className="flex-1 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </DemoErrorBoundary>
    </DemoAuthGuard>
  );
}
