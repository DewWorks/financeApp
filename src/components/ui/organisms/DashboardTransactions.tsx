import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select"
import { Card, CardContent, CardTitle } from "@/components/ui/atoms/card"
import { Search, ListFilter, X, RefreshCw, LayoutList, LayoutGrid, Table as TableIcon } from "lucide-react"
import TimelineMonthSelector from "@/components/ui/molecules/TimelineMonth"
import { TransactionsTable } from "@/components/ui/molecules/TransactionsTable"
import { ITransaction } from "@/interfaces/ITransaction"
import { useDashboardFilters } from "@/hooks/useDashboardFilters"
import { motion } from "framer-motion"

interface DashboardTransactionsProps {
    transactions: ITransaction[] // The list to display (already filtered or paginated)
    filters: ReturnType<typeof useDashboardFilters>
    onEdit: (t: ITransaction) => void
    onDelete: (id: string) => void
    pagination: {
        currentPage: number
        totalPages: number
        onNextPage: () => void
        onPreviousPage: () => void
    }
    monthSelector: {
        selectedMonth: number | null
        onSelectMonth: (month: number | null) => void
    }
    onToggleAll: () => Promise<boolean>
    isAllTransactions: boolean // State for the "Buscar Todas" button
    uniqueTags: string[]
    loading: boolean // Global or Table loading
    isTableLoading: boolean // Specific table loading
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
}

export function DashboardTransactions({
    transactions,
    filters,
    onEdit,
    onDelete,
    pagination,
    monthSelector,
    onToggleAll,
    isAllTransactions,
    uniqueTags,
    loading,
    isTableLoading
}: DashboardTransactionsProps) {
    const {
        searchTerm, setSearchTerm,
        selectedType, setSelectedType,
        selectedTag, setSelectedTag,
        viewMode, setViewMode,
    } = filters

    const handleClearFilters = () => {
        setSearchTerm("")
        setSelectedType("all")
        setSelectedTag("all")
    }

    return (
        <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-gray-800 shadow-lg mb-6 sm:mb-8 transition-colors duration-200">
                <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-0">
                    <CardTitle
                        id="transactions-table"
                        className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 sm:p-4 mb-2 sm:mb-0"
                    >
                        Tabela de Transações
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                        <Button
                            variant="default"
                            size="sm"
                            className={`transition-all sm:m-2 ${isAllTransactions ? "bg-red-600 text-white" : "bg-blue-600 text-white"}`}
                            onClick={onToggleAll}
                        >
                            {isAllTransactions ? (
                                <>
                                    <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="text-xs sm:text-sm">Limpar</span>
                                </>
                            ) : (
                                <>
                                    <Search className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="text-xs sm:text-sm">Buscar Todas</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <CardContent className="p-3 sm:p-6 relative">
                    {/* Loading Overlay */}
                    {(isTableLoading || (loading && transactions.length > 0)) && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50 flex items-start pt-20 justify-center rounded-b-xl">
                            <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        </div>
                    )}

                    {/* Month Selector */}
                    <div className="flex justify-center space-x-1 sm:space-x-2 my-3 sm:my-4 overflow-x-auto w-full">
                        <TimelineMonthSelector onSelectMonth={monthSelector.onSelectMonth} selectedMonth={monthSelector.selectedMonth} />
                    </div>

                    {/* Filters Section */}
                    <div className="flex flex-col gap-3 mb-6 px-2">
                        {/* Top Row: Search + Filters */}
                        <div className="flex flex-col md:flex-row gap-2 w-full" id="filter-bar">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Buscar transação..."
                                    className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="hidden sm:flex items-center gap-1 text-gray-500">
                                    <ListFilter className="w-4 h-4" />
                                    <span className="text-xs font-medium">Filtros:</span>
                                </div>

                                <Select value={selectedType} onValueChange={(val: "all" | "income" | "expense") => setSelectedType(val)}>
                                    <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="income">Receitas</SelectItem>
                                        <SelectItem value="expense">Despesas</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={selectedTag} onValueChange={setSelectedTag}>
                                    <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                                        <SelectValue placeholder="Tag" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Tags</SelectItem>
                                        {uniqueTags.map(tag => (
                                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(searchTerm || selectedType !== 'all' || selectedTag !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClearFilters}
                                        className="h-9 w-9 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Limpar filtros"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* View Toggles */}
                        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800" id="view-toggles">
                            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                                >
                                    <LayoutList className="w-3.5 h-3.5 mr-1.5" />
                                    Lista
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewMode('card')}
                                    className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                                    Cards
                                </Button>
                                <div className="block">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewMode('table')}
                                        className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                                    >
                                        <TableIcon className="w-3.5 h-3.5 mr-1.5" />
                                        Tabela
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Molecule */}
                    <div className={viewMode === 'card' ? 'block' : (viewMode === 'table' ? 'block' : 'block')}>
                        {/* Note: TransactionsTable molecule handles different layouts internally via MobileList etc? 
                            Actually, TransactionsTable handles Desktop Table and Mobile List.
                            The 'card' view mode might need special handling if not in the molecule. 
                            Let's check page.tsx... page.tsx seemed to have "SwipeableTransactionCard" logic.
                            If so, I might need to move that logic HERE or into the Molecule. 
                            The Molecule has "forceDesktopMode".
                            If viewMode is 'list', it uses default behavior.
                            If viewMode is 'card', page.tsx had custom logic. 
                        */}
                        <TransactionsTable
                            transactions={transactions}
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onNextPage={pagination.onNextPage}
                            onPreviousPage={pagination.onPreviousPage}
                            onEditTransaction={onEdit as any} // Type overlap fix
                            onDeleteTransaction={onDelete}
                            forceDesktopMode={viewMode === 'table'} // Use Table view even on mobile if selected
                            viewMode={viewMode}
                        />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
