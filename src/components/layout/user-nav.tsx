'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, LogOut, Mail, User } from 'lucide-react'

import { CONTACT_MAILTO } from '@/lib/contact-info'
import { useInstallPwa } from '@/hooks/use-install-pwa'
import { useAppData } from '@/hooks/use-app-data'
import { useLogout } from '@/hooks/use-logout'

export function UserNav() {
  const { data: session } = useSession()
  const { data: appData } = useAppData()
  const { logout, isLoggingOut } = useLogout()
  const { canInstallNative: canInstall, isInstalling, install } = useInstallPwa()

  const name = appData?.profile.name ?? session?.user?.name ?? 'User'
  const email = appData?.profile.email ?? session?.user?.email ?? ''
  const avatar = appData?.profile.avatar ?? session?.user?.image ?? ''

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            {email && (
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" prefetch className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          {canInstall ? (
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={isInstalling}
              onClick={() => void install()}
            >
              <Download className="mr-2 h-4 w-4" />
              <span>{isInstalling ? 'Installing...' : 'Install app'}</span>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <a href={CONTACT_MAILTO} className="cursor-pointer">
              <Mail className="mr-2 h-4 w-4" />
              <span>Contact us</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          disabled={isLoggingOut}
          onClick={() => void logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
