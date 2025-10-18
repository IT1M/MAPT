'use client'

import { ProfileSettings } from '../ProfileSettings'

interface ProfileSettingsContainerProps {
  userId: string
}

export function ProfileSettingsContainer({ userId }: ProfileSettingsContainerProps) {
  return <ProfileSettings userId={userId} />
}
