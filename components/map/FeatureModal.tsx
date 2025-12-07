'use client'

import { FeaturePopupContent } from './FeaturePopupContent'
import { useFeatureModal } from './FeatureModalContext'
import { Modal } from '@/components/ui/modal'
import { Z_INDEX } from '@/lib/constants'

export function FeatureModal() {
  const { selectedFeature, isOpen, animationOrigin, closeModal } = useFeatureModal()

  if (!selectedFeature) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      zIndex={Z_INDEX.FEATURE_MODAL}
      animationOrigin={animationOrigin}
    >
      <FeaturePopupContent feature={selectedFeature} />
    </Modal>
  )
}
