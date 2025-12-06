import { useCallback, useState } from "react"

export const useDeleteConfirmation = () => {
  const [idForDeletion, setIdForDeletion] = useState<string>()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = useCallback(
    (id: string) => () => {
      setIsModalOpen(true)
      setIdForDeletion(id)
    },
    []
  )

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setIdForDeletion(undefined)
  }, [])

  return {
    idForDeletion,
    isModalOpen,
    openModal,
    closeModal,
  }
}
