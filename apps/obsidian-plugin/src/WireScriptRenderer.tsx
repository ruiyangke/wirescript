import type { WireDocument } from '@wirescript/dsl';
import { ThemeProvider, WireRenderer } from '@wirescript/renderer';
import { useState } from 'react';

interface WireScriptRendererProps {
  document: WireDocument;
  initialScreen?: string;
}

export function WireScriptRenderer({ document, initialScreen }: WireScriptRendererProps) {
  const screens = document.screens;
  const [selectedScreen, setSelectedScreen] = useState<string | undefined>(
    initialScreen || screens[0]?.id
  );

  const activeScreenId = selectedScreen || screens[0]?.id;

  return (
    <ThemeProvider>
      <div className="wirescript-wrapper theme">
        {/* Screen selector if multiple screens */}
        {screens.length > 1 && (
          <div className="flex items-center border-b border-border bg-muted/30">
            <div className="flex">
              {screens.map((screen) => {
                const isActive = screen.id === activeScreenId;
                return (
                  <button
                    key={screen.id}
                    onClick={() => setSelectedScreen(screen.id)}
                    className={`
                      relative px-4 py-2.5
                      text-sm font-medium
                      transition-colors duration-150
                      border-b-2 -mb-px
                      ${
                        isActive
                          ? 'text-foreground border-primary bg-background'
                          : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                    aria-selected={isActive}
                    role="tab"
                  >
                    {screen.name || screen.id}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto pr-3 text-xs text-muted-foreground/60 tabular-nums">
              {screens.findIndex((s) => s.id === activeScreenId) + 1}/{screens.length}
            </div>
          </div>
        )}

        {/* Render the wireframe */}
        <div className="wirescript-wireframe">
          <WireRenderer
            document={document}
            screenId={activeScreenId}
            onScreenChange={setSelectedScreen}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
