"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/atoms/button"
import { Card, CardContent } from "@/components/ui/atoms/card"
import { Users, ChevronDown, User, Plus } from "lucide-react"
import axios from "axios"

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
        if (savedProfileId && savedProfileId !== "null") {
            setCurrentProfile({ _id: savedProfileId } as Profile)
        } else {
            setCurrentProfile(null)
        }
    }

    const switchToProfile = (profile: Profile | null) => {
        setCurrentProfile(profile)
        setIsOpen(false)

        if (profile) {
            localStorage.setItem("current-profile-id", profile._id)
            localStorage.setItem("current-profile-name", profile.name)
        } else {
            localStorage.setItem("current-profile-id", "null")
            localStorage.removeItem("current-profile-name")
        }

        onProfileSwitch(profile?._id || null)
        window.location.reload()
    }

    const getCurrentDisplayName = () => {
        if (!currentProfile) return "Pessoal"
        const profile = profiles.find((p) => p._id === currentProfile._id)
        return profile?.name || "Profile"
    }

    const truncateName = (name: string, maxLength = 12) => {
        return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
    }

    if (loading) {
        return <div className="bg-gray-200 animate-pulse rounded-lg px-3 py-2 w-32 h-9"></div>
    }

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200 px-3 py-2 h-9 min-w-0"
            >
                <div className="flex items-center gap-2 min-w-0">
                    {currentProfile ? (
                        <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    ) : (
                        <User className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate">{truncateName(getCurrentDisplayName())}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            </Button>

            {isOpen && (
                <>
                    {/* Overlay para fechar ao clicar fora */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    <Card className="absolute top-12 left-1/2 transform -translate-x-1/2 w-80 z-50 shadow-xl border-2">
                        <CardContent className="p-4">
                            <div className="mb-3">
                                <h4 className="font-semibold text-gray-800 mb-2 text-center">Trocar Conta</h4>
                            </div>

                            {/* Conta Pessoal */}
                            <Button
                                variant="ghost"
                                className={`w-full justify-start mb-2 h-auto p-3 ${
                                    !currentProfile ? "bg-green-50 border border-green-200" : ""
                                }`}
                                onClick={() => switchToProfile(null)}
                            >
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-green-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">Conta Pessoal</span>
                                        <span className="text-xs text-gray-500">Suas transações individuais</span>
                                    </div>
                                </div>
                            </Button>

                            {/* Profiles Colaborativos */}
                            {profiles.length > 0 && (
                                <>
                                    <hr className="my-3" />
                                    <h5 className="text-sm font-medium text-gray-600 mb-2">Contas Colaborativas</h5>
                                    <div className="max-h-48 overflow-y-auto">
                                        {profiles.map((profile) => (
                                            <Button
                                                key={profile._id}
                                                variant="ghost"
                                                className={`w-full justify-start mb-2 h-auto p-3 ${
                                                    currentProfile?._id === profile._id ? "bg-blue-50 border border-blue-200" : ""
                                                }`}
                                                onClick={() => switchToProfile(profile)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-5 h-5 text-blue-500" />
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-medium">{profile.name}</span>
                                                        <span className="text-xs text-gray-500">{profile.members.length} membro(s)</span>
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Criar Nova Conta */}
                            <hr className="my-3" />
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                    setIsOpen(false)
                                    window.location.href = "/profiles/create"
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Conta Colaborativa
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
