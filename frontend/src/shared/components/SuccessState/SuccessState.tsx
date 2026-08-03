import { CheckCircle } from "lucide-react"

interface SuccessStateProps {
  title: string
  detail?: string
  linkLabel: string
  onLinkClick: () => void
}

export function SuccessState({ title, detail, linkLabel, onLinkClick }: SuccessStateProps) {
  return (
    <div className="rounded-md border border-success-border bg-success-light p-6 text-center">
      <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
      <p className="mb-3 text-base font-medium text-success-text">
        {title}
      </p>
      {detail && (
        <p className="mb-3 text-sm text-success-text/80">
          {detail}
        </p>
      )}
      <button
        type="button"
        onClick={onLinkClick}
        className="text-sm font-medium text-primary hover:underline"
      >
        {linkLabel}
      </button>
    </div>
  )
}
