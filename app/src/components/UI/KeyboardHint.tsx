export default function KeyboardHint({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs">
      <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono">
        {keys}
      </kbd>
      <span className="text-gray-600">{action}</span>
    </div>
  );
}