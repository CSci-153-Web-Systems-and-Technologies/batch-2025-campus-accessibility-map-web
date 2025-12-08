'use client'

import { BuildingModalContent } from './BuildingModalContent'
import { useBuildingModal } from './BuildingModalContext'
import { Modal } from '@/components/ui/modal'
import { Z_INDEX } from '@/lib/constants'

export function BuildingModal() {
  const { selectedBuilding, isOpen, animationOrigin, closeModal } = useBuildingModal()

  if (!selectedBuilding) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      zIndex={Z_INDEX.BUILDING_MODAL}
      animationOrigin={animationOrigin}
      hideCloseButton={true}
    >
      <BuildingModalContent building={selectedBuilding} />
    </Modal>
  )
}

