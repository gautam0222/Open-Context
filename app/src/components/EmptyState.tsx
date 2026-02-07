interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="text-8xl mb-6 animate-pulse-slow">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/80 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition hover:-translate-y-1 transform"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}