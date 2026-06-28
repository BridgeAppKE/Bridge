import { ensureDefaultProperty, getUserProperties } from "@/lib/actions/properties";
import { getReceiptOcrQuota } from "@/lib/actions/receipt-ocr";
import { PortfolioCapture } from "@/components/unit/portfolio-capture";
import { pageShellClass, pageTitleClass, sectionLabelClass } from "@/lib/design/tokens";

export default async function PortfolioCapturePage() {
  await ensureDefaultProperty();
  const [properties, quota] = await Promise.all([
    getUserProperties(),
    getReceiptOcrQuota(),
  ]);

  return (
    <div className={pageShellClass}>
      <header className="mb-6 space-y-1">
        <p className={sectionLabelClass}>Portfolio</p>
        <h1 className={pageTitleClass}>Bulk shop</h1>
        <p className="text-sm text-muted-foreground">
          One receipt, split costs manually across your units.
        </p>
      </header>

      <PortfolioCapture
        units={properties.map((p) => ({ id: p.id, name: p.name }))}
        ocrRemaining={quota.remaining}
        ocrLimit={quota.limit}
      />
    </div>
  );
}
