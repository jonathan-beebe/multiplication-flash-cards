import { useState, useEffect } from 'react'
import { subscribe, isUpdateAvailable, applyUpdate } from './updateNotifier'

export function useUpdateAvailable() {
  const [updateAvailable, setUpdateAvailable] = useState(isUpdateAvailable)

  useEffect(() => {
    return subscribe(() => setUpdateAvailable(true))
  }, [])

  return { updateAvailable, applyUpdate }
}
