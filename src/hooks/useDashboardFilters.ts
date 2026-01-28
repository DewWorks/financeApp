import { useState, useEffect } from "react"
import { ITransaction } from "@/interfaces/ITransaction"

interface UseDashboardFiltersProps {
    allTransactions: ITransaction[]
    getAllTransactions: () => Promise<void>
}

export function useDashboardFilters({ allTransactions, getAllTransactions }: UseDashboardFiltersProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
    const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all")
    const [selectedTag, setSelectedTag] = useState<string>("all")
    const [viewMode, setViewMode] = useState<'list' | 'card' | 'table'>('list')
    const [isTableLoading, setIsTableLoading] = useState(false)

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500)
        return () => clearTimeout(handler)
    }, [searchTerm])

    // Trigger Fetch on Search
    useEffect(() => {
        if (debouncedSearchTerm && allTransactions.length === 0) {
            getAllTransactions();
        }
    }, [debouncedSearchTerm, allTransactions.length, getAllTransactions]);

    // Derived Filtered List
    const filteredTransactions = allTransactions.filter(t => {
        const matchesSearch = debouncedSearchTerm
            ? t.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            t.tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            t.amount.toString().includes(debouncedSearchTerm)
            : true;

        const matchesType = selectedType === "all" ? true : t.type === selectedType;
        const matchesTag = selectedTag === "all" ? true : t.tag === selectedTag;

        return matchesSearch && matchesType && matchesTag;
    });

    const isFiltering = debouncedSearchTerm !== "" || selectedType !== "all" || selectedTag !== "all";

    return {
        searchTerm, setSearchTerm,
        debouncedSearchTerm,
        selectedType, setSelectedType,
        selectedTag, setSelectedTag,
        viewMode, setViewMode,
        isTableLoading, setIsTableLoading,
        filteredTransactions,
        isFiltering
    }
}
