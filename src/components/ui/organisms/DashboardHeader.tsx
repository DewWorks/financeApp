import { IUser } from "@/interfaces/IUser"
import { Title } from "@/components/ui/molecules/Title"
import { ProfileSwitcher } from "@/components/ui/molecules/ProfileSwitcher"
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle"
import { Button } from "@/components/ui/atoms/button"
import { Tooltip } from "@/components/ui/atoms/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import { LogOut, User, LogIn, Menu } from "lucide-react"
import { motion } from "framer-motion"

interface DashboardHeaderProps {
    user: IUser | null
    handleLogout: () => void
    handleProfileSwitch: (profileId: string | null) => void
    handleProfile: () => void
    toggleTheme: () => void
}

export function DashboardHeader({
    user,
    handleLogout,
    handleProfileSwitch,
    handleProfile,
    toggleTheme
}: DashboardHeaderProps) {
    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Title size="md" />
                    </div>

                    {/* Profile Switcher - Align left next to logo */}
                    <div className="hidden sm:flex flex-1 justify-start ml-4 sm:ml-8" id="profile-switcher">
                        <ProfileSwitcher onProfileSwitch={handleProfileSwitch} userName={user?.name} userEmail={user?.email} />
                    </div>

                    {/* Desktop Area - User Info, Logout, Theme */}
                    <div className="hidden sm:flex items-center space-x-2">

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {user && (
                            <>
                                {/* User Info */}
                                <Tooltip title={'Perfil'} arrow>
                                    <Button
                                        className="p-2 rounded-lg bg-transparent transition-colors hover:bg-blue-100 dark:hover:bg-gray-700"
                                        onClick={handleProfile}
                                    >
                                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                </Tooltip>

                                {/* Logout */}
                                <Tooltip title="Sair" arrow>
                                    <Button
                                        onClick={handleLogout}
                                        className="p-2 rounded-lg bg-transparent transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </Button>
                                </Tooltip>
                            </>
                        )}

                        {!user && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Button onClick={() => (window.location.href = "/auth/login")} variant="ghost" size="sm">
                                    <LogIn className="h-5 w-5 mr-2 text-green-600" />
                                    <span>Entrar</span>
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    {/* Mobile Menu - Hamburger */}
                    <div className="flex sm:hidden items-center ml-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10">
                                    <Menu className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 max-w-[calc(100vw-1rem)] p-3 mr-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl" align="end">
                                <div className="flex flex-col gap-2">
                                    {/* Mobile User Info Section */}
                                    {user && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 mb-2">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800 flex-shrink-0">
                                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                    {user.name || "Usuário"}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Theme Toggle Row */}
                                    <div
                                        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                        onClick={() => toggleTheme()}
                                    >
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Alterar Tema</span>
                                        <div className="pointer-events-none">
                                            <ThemeToggle />
                                        </div>
                                    </div>

                                    {user && (
                                        <>
                                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start px-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={handleProfile}
                                            >
                                                <User className="h-4 w-4 mr-2 text-blue-500" />
                                                Perfil
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start px-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={handleLogout}
                                            >
                                                <LogOut className="h-4 w-4 mr-2" />
                                                Sair
                                            </Button>
                                        </>
                                    )}

                                    {!user && (
                                        <>
                                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                                            <Button
                                                onClick={() => (window.location.href = "/auth/login")}
                                                variant="ghost"
                                                className="w-full justify-start px-3 text-green-600"
                                            >
                                                <LogIn className="h-4 w-4 mr-2" />
                                                Entrar
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </nav >
    )
}
