import { redirect } from 'next/navigation'

/** Announcements hub removed — send legacy links to dashboard. */
export default function HomeAnnouncementsRoutePage() {
  redirect('/home')
}
