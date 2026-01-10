import type { WireDocument } from '@wirescript/dsl';
import { ThemeProvider, type Viewport, WireRenderer } from '@wirescript/renderer';

interface WireScriptRendererProps {
  document: WireDocument;
  screenId?: string;
  viewport?: Viewport;
  onScreenChange?: (screenId: string) => void;
  zoom?: number;
}

export function WireScriptRenderer({
  document,
  screenId,
  viewport,
  onScreenChange,
  zoom = 1,
}: WireScriptRendererProps) {
  const screens = document.screens;
  const activeScreenId = screenId || screens[0]?.id;

  return (
    <ThemeProvider>
      <div className="wirescript-wrapper theme">
        <WireRenderer
          document={document}
          screenId={activeScreenId}
          viewport={viewport}
          zoom={zoom}
          onScreenChange={onScreenChange}
        />
      </div>
    </ThemeProvider>
  );
}
