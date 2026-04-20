export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      {Icon && (
        <div className="w-20 h-20 rounded-3xl bg-secondary border border-border flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-muted-foreground" />
        </div>
      )}
      {title && <h2 className="font-heebo font-extrabold text-2xl text-foreground/90 mb-2">{title}</h2>}
      {description && <p className="text-muted-foreground text-sm mb-8 max-w-xs">{description}</p>}
      {children}
    </div>
  );
}
