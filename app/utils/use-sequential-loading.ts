import { useEffect, useRef, useState } from "react"

type LoadingPhase = "LOW_RES" | "HIGH_RES" | "COMPLETED"

type Args = {
  itemsCount: number
  onComplete?: () => void
}

export function useSequentialLoading({ itemsCount, onComplete }: Args) {
  // State for sequential loading
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("LOW_RES")
  const [currentLowResIndex, setCurrentLowResIndex] = useState(0)
  const [currentHighResIndex, setCurrentHighResIndex] = useState(0)

  // Track the number of items for handling new items being added
  const prevItemsCountRef = useRef(itemsCount)

  // Handle when new items are added
  useEffect(() => {
    const prevCount = prevItemsCountRef.current

    // If new items were added
    if (itemsCount > prevCount) {
      // If we were in HIGH_RES or COMPLETED phase, go back to LOW_RES for new items
      if (loadingPhase !== "LOW_RES") {
        setLoadingPhase("LOW_RES")
      }

      // Start loading from the first new low-res image
      if (currentLowResIndex >= prevCount) {
        setCurrentLowResIndex(prevCount)
      }
    }

    // Update the reference
    prevItemsCountRef.current = itemsCount
  }, [itemsCount, loadingPhase, currentLowResIndex])

  // Handler when a low-res image is loaded
  const handleLowResLoaded = (index: number) => {
    // Move to the next low-res image
    const nextIndex = index + 1
    setCurrentLowResIndex(nextIndex)

    // If all low-res images are loaded, move to high-res phase
    if (nextIndex >= itemsCount) {
      setLoadingPhase("HIGH_RES")
      setCurrentHighResIndex(0) // Start from the first image
    }
  }

  // Handler when a high-res image is loaded
  const handleHighResLoaded = (index: number) => {
    // Move to the next high-res image
    const nextIndex = index + 1
    setCurrentHighResIndex(nextIndex)

    // If all high-res images are loaded, we're done
    if (nextIndex >= itemsCount) {
      setLoadingPhase("COMPLETED")
      onComplete?.()
    }
  }

  return {
    loadingPhase,
    currentLowResIndex,
    currentHighResIndex,
    shouldLoadLowRes: (index: number) =>
      loadingPhase === "LOW_RES" && index === currentLowResIndex,
    shouldLoadHighRes: (index: number) =>
      loadingPhase === "HIGH_RES" && index === currentHighResIndex,
    handleLowResLoaded,
    handleHighResLoaded,
  }
}
