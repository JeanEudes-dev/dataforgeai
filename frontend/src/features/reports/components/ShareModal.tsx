import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ClipboardIcon,
  CheckIcon,
  LinkIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline'
import { Modal, Button } from '@/components/ui'
import { reportsApi } from '@/api'
import { useToastActions } from '@/contexts'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string
  currentShareUrl: string | null
  isPublic: boolean
  onShareToggle: () => void
}

export function ShareModal({
  isOpen,
  onClose,
  reportId,
  currentShareUrl,
  isPublic,
  onShareToggle,
}: ShareModalProps) {
  const toast = useToastActions()
  const [copied, setCopied] = useState(false)

  const shareMutation = useMutation({
    mutationFn: (enable: boolean) => reportsApi.share(reportId, { enable }),
    onSuccess: (data) => {
      if (data.is_public) {
        toast.success('Report shared', 'Anyone with the link can now view this report.')
      } else {
        toast.success('Sharing disabled', 'The report is now private.')
      }
      onShareToggle()
    },
    onError: () => {
      toast.error('Failed', 'Could not update sharing settings.')
    },
  })

  const fullShareUrl = currentShareUrl
    ? `${window.location.origin}${currentShareUrl}`
    : null

  const handleCopyLink = async () => {
    if (!fullShareUrl) return

    try {
      await navigator.clipboard.writeText(fullShareUrl)
      setCopied(true)
      toast.success('Copied!', 'Link copied to clipboard.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed', 'Could not copy link to clipboard.')
    }
  }

  const handleToggleShare = () => {
    shareMutation.mutate(!isPublic)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share report"
      description="Control access and copy a lightweight share link"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <GlobeAltIcon className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <LockClosedIcon className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {isPublic ? 'Public link active' : 'Private report'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isPublic ? 'Anyone with the link can view.' : 'Only you can access this report.'}
              </p>
            </div>
          </div>
          <Button
            variant={isPublic ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggleShare}
            isLoading={shareMutation.isPending}
          >
            {isPublic ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {isPublic && fullShareUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Share link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-sm">
                <LinkIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={fullShareUrl}
                  readOnly
                  className="flex-1 text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none truncate"
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ClipboardIcon className="w-5 h-5" />
                )}
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Shared reports show limited information and omit sensitive data.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-start gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-primary-600 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">What’s shared</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>Dataset overview & stats</li>
                <li>EDA visuals & insights</li>
                <li>Model performance (if present)</li>
                <li>AI-generated summary</li>
              </ul>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-start gap-3">
            <BellAlertIcon className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">What stays private</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>Raw data rows</li>
                <li>Owner details</li>
                <li>Credentials or secrets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ShareModal
