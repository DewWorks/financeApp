"use client"

interface TitleProps {
    className?: string
    iconColor?: string
    textColor?: string
    size?: "sm" | "md" | "lg" | "xl"
    showText?: boolean
}

export function Title({
    className = "",
    iconColor = "#3B82F6", // azul padrão
    textColor,
    size = "md",
    showText = true,
}: TitleProps) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
    }

    const textSizeClasses = {
        sm: "text-lg",
        md: "text-xl",
        lg: "text-2xl",
        xl: "text-3xl",
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Ícone SVG do FinancePro */}
            <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="3" fill={iconColor} opacity="0.1" />
                <rect x="2" y="4" width="20" height="16" rx="3" stroke={iconColor} strokeWidth="2" />
                <path d="M7 12h10M7 8h6" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
                <circle cx="17" cy="16" r="2" fill={iconColor} />
            </svg>

            {/* Texto */}
            {showText && (
                <span className={`font-bold ${textSizeClasses[size]} ${textColor ? '' : 'text-foreground'}`} style={textColor ? { color: textColor } : {}}>
                    FinancePro
                </span>
            )}
        </div>
    )
}

// Versões pré-definidas para facilitar o uso
export function TitleWhite(props: Omit<TitleProps, "iconColor" | "textColor">) {
    return <Title {...props} iconColor="#FFFFFF" textColor="#FFFFFF" />
}

export function TitleGreen(props: Omit<TitleProps, "iconColor" | "textColor">) {
    return <Title {...props} iconColor="#10B981" textColor="#065F46" />
}

export function TitleBlue(props: Omit<TitleProps, "iconColor" | "textColor">) {
    return <Title {...props} iconColor="#3B82F6" textColor="#1E40AF" />
}

export function TitleGray(props: Omit<TitleProps, "iconColor" | "textColor">) {
    return <Title {...props} iconColor="#6B7280" textColor="#374151" />
}
