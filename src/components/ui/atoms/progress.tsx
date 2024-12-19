import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number
    max?: number
    color?: string
    backgroundColor?: string
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ value, max = 100, color = "bg-blue-600", backgroundColor = "bg-gray-200", className, ...props }, ref) => {
        const percentage = Math.min(Math.max(value, 0), max) / max * 100

        return (
            <div
                ref={ref}
                className={`h-2 w-full overflow-hidden rounded-full ${backgroundColor} ${className}`}
                {...props}
            >
                <div
                    className={`h-full ${color} transition-all duration-300 ease-in-out`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        )
    }
)

Progress.displayName = "Progress"

