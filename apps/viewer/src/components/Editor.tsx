import { WireScriptEditor } from '@wirescript/editor';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  errors: string[];
}

export function Editor({ value, onChange, errors }: EditorProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <span className="text-sm font-medium">WireScript Editor</span>
        <span className="text-xs text-gray-400">{value.split('\n').length} lines</span>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-h-0">
        <WireScriptEditor value={value} onChange={onChange} dark={true} autoFocus={true} />
      </div>

      {/* Error Panel */}
      {errors.length > 0 && (
        <div className="bg-red-900 text-red-100 p-3 border-t border-red-700">
          <div className="text-xs font-medium mb-1">Errors:</div>
          {errors.map((error) => (
            <div key={error} className="text-xs font-mono">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
