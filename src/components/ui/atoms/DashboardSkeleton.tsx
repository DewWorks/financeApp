
import { Skeleton } from "@/components/ui/atoms/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/atoms/card"

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex space-x-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32 mb-2" />
                            <Skeleton className="h-3 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>

            <div className="space-y-2">
                <Skeleton className="h-8 w-40 mb-4" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
            </div>
        </div>
    )
}
