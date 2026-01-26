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
    userName?: string
    userEmail?: string
}

export function ProfileSwitcher({ onProfileSwitch, userName, userEmail }: ProfileSwitcherProps) {
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
                localStorage.setItem("profile-account", 'true')
                localStorage.setItem("current-profile-name", profile.name)
            } else {
                console.log("Switching to personal account")
                localStorage.setItem("profile-account", 'false')
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

    const getFirstName = (fullName: string) => {
        return fullName.split(' ')[0]
    }

    const getCurrentDisplayName = () => {
        if (!currentProfile) {
            return userName ? `Olá, ${getFirstName(userName)}` : "Conta Pessoal"
        }
        return profiles.find((p) => p._id === currentProfile._id)?.name || currentProfile.name || "Profile"
    }

    const isCurrentProfile = (profile: Profile | null) => {
        if (!profile && !currentProfile) return true
        if (!profile || !currentProfile) return false
        return profile._id === currentProfile._id
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg px-3 py-2 w-48">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
        )
    }

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-background hover:bg-accent border-2 border-border px-3 py-2 h-9 max-w-[200px] min-w-0 overflow-hidden"
            >
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {currentProfile ? (
                        <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    ) : (
                        <User className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    <span
                        className="truncate whitespace-nowrap text-sm font-medium overflow-hidden text-foreground"
                        title={getCurrentDisplayName()} // tooltip
                    >
                        {getCurrentDisplayName()}
                    </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Button>

            {isOpen && (
                <Card className="absolute bg-white dark:bg-zinc-950 top-12 left-0 w-80 z-50 shadow-xl border-2 animate-in slide-in-from-top-2 duration-200">
                    <CardContent className="p-4">
                        <div className="mb-3">
                            <h4 className="font-semibold text-foreground text-sm">Minha Conta</h4>
                        </div>

                        {/* User Info Card */}
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium text-sm text-foreground truncate" title={userName}>{userName || "Usuário"}</p>
                                <p className="text-xs text-muted-foreground truncate" title={userEmail}>{userEmail || "email@exemplo.com"}</p>
                            </div>
                        </div>

                        {/* Profiles Colaborativos - TEMPORARILY DISABLED
                        {profiles.length > 0 && (
                            <>
                                <div className="border-t border-border my-4"></div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-3">Contas Colaborativas</h5>
                                <div className="space-y-2">
                                    {profiles.map((profile) => (
                                        <Button
                                            key={profile._id}
                                            variant="ghost"
                                            className={`w-full justify-between h-auto p-3 rounded-lg transition-all duration-200 ${isCurrentProfile(profile) ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm" : "hover:bg-accent"
                                                }`}
                                            onClick={() => switchToProfile(profile)}
                                            disabled={switching}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-2 rounded-full ${isCurrentProfile(profile) ? "bg-blue-100 dark:bg-blue-900/40" : "bg-muted"}`}
                                                >
                                                    <Users
                                                        className={`w-4 h-4 ${isCurrentProfile(profile) ? "text-blue-600" : "text-gray-600 dark:text-gray-400"}`}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium text-foreground">{profile.name}</span>
                                                    <span className="text-xs text-muted-foreground">{profile.members.length} membro(s)</span>
                                                </div>
                                            </div>
                                            {isCurrentProfile(profile) && <Check className="w-4 h-4 text-blue-600" />}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}
                        */}

                        {/* Criar Nova Conta - TEMPORARILY DISABLED
                        <div className="border-t border-border my-4"></div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-3 rounded-lg transition-all duration-200"
                            onClick={() => {
                                setIsOpen(false)
                                router.push("/profiles/create")
                            }}
                            disabled={switching}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40">
                                    <Plus className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium">Criar Conta Colaborativa</span>
                            </div>
                        </Button>
                        */}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
