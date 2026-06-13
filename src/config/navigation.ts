import { MessageSquare, User, LucideIcon } from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  description?: string
}

export const mainNavigation: NavItem[] = [
  {
    name: 'AI Chat',
    href: '/chat',
    icon: MessageSquare,
    description: 'Practice with AI interviewer',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    description: 'Manage your profile and preferences',
  },
]

export const footerNavigation = [
  { name: 'Login', href: '/login' },
  { name: 'Register', href: '/register' },
  { name: 'AI Chat', href: '/chat' },
  { name: 'Profile', href: '/profile' },
]
