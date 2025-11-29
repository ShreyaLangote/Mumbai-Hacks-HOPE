import Link from "next/link"
import { Activity } from "lucide-react"

export function Header({ deviceToken }: { deviceToken?: string | null }) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Activity className="h-6 w-6 text-red-600" />
                        <span className="hidden font-bold sm:inline-block text-xl">
                            HOPE <span className="text-red-600">Ambulance</span>
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href="/intake"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            Intake
                        </Link>
                        <Link
                            href="/activate"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            Activate
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Add search or other controls here if needed */}
                    </div>
                    <div className="flex items-center gap-2">
                        {deviceToken ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-medium text-green-500">Active</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span className="text-xs font-medium text-yellow-500">Inactive</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
