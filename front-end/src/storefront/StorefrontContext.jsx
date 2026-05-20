/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'

const StorefrontContext = createContext(null)

export function StorefrontProvider({ value, children }) {
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}

export function useStorefront() {
  const context = useContext(StorefrontContext)
  if (!context) {
    throw new Error('useStorefront must be used within StorefrontProvider')
  }
  return context
}
