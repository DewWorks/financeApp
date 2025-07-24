"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/atoms/button"
import { Card, CardContent } from "@/components/ui/atoms/card"
import { Users, ChevronDown, User, Plus, Check } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"

interface Profile {
    _id: string
    name: string
    type: string
    members: Array<{
        userId: string
        permission: string
    }>
}

interface ProfileSwitcherProps {
    onProfileSwitch: (profileId: string | null) => void
}

export function ProfileSwitcher({ onProfileSwitch }: ProfileSwitcherProps) {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [switching, setSwitching] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchProfiles()
        loadCurrentProfile()
    }, [])

    const fetchProfiles = async () => {
        try {
            const response = await axios.get("/api/profiles")
            setProfiles(response.data.profiles)
        } catch (error) {
            console.error("Error fetching profiles:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadCurrentProfile = () => {
        const savedProfileId = localStorage.getItem("current-profile-id")
        const savedProfileName = localStorage.getItem("current-profile-name")

        if (savedProfileId && savedProfileId !== "null") {
            setCurrentProfile({
                _id: savedProfileId,
                name: savedProfileName || "Profile",
                type: "collaborative",
                members: [],
            } as Profile)
        } else {
            setCurrentProfile(null)
        }
    }

    const switchToProfile = async (profile: Profile | null) => {
        if (switching) return // Prevent multiple clicks

        setSwitching(true)
        setCurrentProfile(profile)
        setIsOpen(false)

        try {
            // Update localStorage
            if (profile) {
                localStorage.setItem("current-profile-id", profile._id)
                localStorage.setItem("current-profile-name", profile.name)
            } else {
                localStorage.setItem("current-profile-id", "null")
                localStorage.removeItem("current-profile-name")
            }

            // Notify parent component for immediate UI updates
            onProfileSwitch(profile?._id || null)

            // Add a small delay for smooth transition
            await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (error) {
            console.error("Error switching profile:", error)
        } finally {
            setSwitching(false)
        }
    }

    const getCurrentDisplayName = () => {
        if (!currentProfile) return "Conta Pessoal"
        return profiles.find((p) => p._id === currentProfile._id)?.name || currentProfile.name || "Profile"
    }

    const isCurrentProfile = (profile: Profile | null) => {
        if (!profile && !currentProfile) return true
        if (!profile || !currentProfile) return false
        return profile._id === currentProfile._id
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 bg-gray-200 animate-pulse rounded-lg px-3 py-2 w-48">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="w-24 h-4 bg-gray-300 rounded"></div>
            </div>
        )
    }

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200 px-3 py-2 h-9 max-w-[200px] min-w-0 overflow-hidden"
            >
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {currentProfile ? (
                        <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    ) : (
                        <User className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    <span
                        className="truncate whitespace-nowrap text-sm font-medium overflow-hidden"
                        title={getCurrentDisplayName()} // tooltip
                    >
      {getCurrentDisplayName()}
    </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            </Button>

            {isOpen && (
                <Card className="absolute bg-white top-12 left-0 w-80 z-50 shadow-xl border-2 animate-in slide-in-from-top-2 duration-200">
                    <CardContent className="p-4">
                        <div className="mb-4">
                            <h4 className="font-semibold text-gray-800 text-sm">Trocar Conta</h4>
                        </div>

                        {/* Conta Pessoal */}
                        <Button
                            variant="ghost"
                            className={`w-full justify-between mb-3 h-auto p-3 rounded-lg transition-all duration-200 ${
                                isCurrentProfile(null) ? "bg-green-50 border border-green-200 shadow-sm" : "hover:bg-gray-50"
                            }`}
                            onClick={() => switchToProfile(null)}
                            disabled={switching}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isCurrentProfile(null) ? "bg-green-100" : "bg-gray-100"}`}>
                                    <User className={`w-4 h-4 ${isCurrentProfile(null) ? "text-green-600" : "text-gray-600"}`} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium text-gray-900">Conta Pessoal</span>
                                    <span className="text-xs text-gray-500">Suas transações individuais</span>
                                </div>
                            </div>
                            {isCurrentProfile(null) && <Check className="w-4 h-4 text-green-600" />}
                        </Button>

                        {/* Profiles Colaborativos */}
                        {profiles.length > 0 && (
                            <>
                                <div className="border-t border-gray-200 my-4"></div>
                                <h5 className="text-sm font-medium text-gray-600 mb-3">Contas Colaborativas</h5>
                                <div className="space-y-2">
                                    {profiles.map((profile) => (
                                        <Button
                                            key={profile._id}
                                            variant="ghost"
                                            className={`w-full justify-between h-auto p-3 rounded-lg transition-all duration-200 ${
                                                isCurrentProfile(profile) ? "bg-blue-50 border border-blue-200 shadow-sm" : "hover:bg-gray-50"
                                            }`}
                                            onClick={() => switchToProfile(profile)}
                                            disabled={switching}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-2 rounded-full ${isCurrentProfile(profile) ? "bg-blue-100" : "bg-gray-100"}`}
                                                >
                                                    <Users
                                                        className={`w-4 h-4 ${isCurrentProfile(profile) ? "text-blue-600" : "text-gray-600"}`}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium text-gray-900">{profile.name}</span>
                                                    <span className="text-xs text-gray-500">{profile.members.length} membro(s)</span>
                                                </div>
                                            </div>
                                            {isCurrentProfile(profile) && <Check className="w-4 h-4 text-blue-600" />}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Criar Nova Conta */}
                        <div className="border-t border-gray-200 my-4"></div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-all duration-200"
                            onClick={() => {
                                setIsOpen(false)
                                router.push("/profiles/create")
                            }}
                            disabled={switching}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100">
                                    <Plus className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium">Criar Conta Colaborativa</span>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
