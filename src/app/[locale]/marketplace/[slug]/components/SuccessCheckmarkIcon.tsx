// Shared success-checkmark SVG used by both the install and payment
// marketplace modals' success states. `className` carries sizing/color
// utility classes; the path is fixed.
export function SuccessCheckmarkIcon({
  className = "w-10 h-10 text-green-400",
}: {
  className?: string;
}) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
