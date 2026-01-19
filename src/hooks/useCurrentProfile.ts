"use client"

import { useState, useEffect, useCallback } from "react"

export function useCurrentProfile() {
    const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
    const [currentProfileName, setCurrentProfileName] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Carregar do localStorage
        const profileId = localStorage.getItem("current-profile-id")
        const profileName = localStorage.getItem("current-profile-name")

        setCurrentProfileId(profileId === "null" ? null : profileId)
        setCurrentProfileName(profileName || "Conta Pessoal")
        setIsLoading(false)
    }, [])

    const switchProfile = useCallback((profileId: string | null, profileName?: string) => {
        setCurrentProfileId(profileId)

        if (profileId) {
            localStorage.setItem("current-profile-id", profileId)
            if (profileName) {
                localStorage.setItem("current-profile-name", profileName)
                setCurrentProfileName(profileName)
            }
        } else {
            localStorage.setItem("current-profile-id", "null")
            localStorage.removeItem("current-profile-name")
            setCurrentProfileName("Conta Pessoal")
        }
    }, [])

    return {
        currentProfileId,
        currentProfileName,
        switchProfile,
        isPersonal: !currentProfileId,
        isLoading
    }
}
