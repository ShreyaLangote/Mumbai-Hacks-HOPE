import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "critical" | "moderate" | "low"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        critical: "border-transparent bg-red-600 text-white hover:bg-red-700",
        moderate: "border-transparent bg-yellow-500 text-black hover:bg-yellow-600",
        low: "border-transparent bg-green-500 text-white hover:bg-green-600",
    }

    const combinedClassName = `${baseStyles} ${variants[variant]} ${className || ""}`

    return (
        <div className={combinedClassName} {...props} />
    )
}

export { Badge }
