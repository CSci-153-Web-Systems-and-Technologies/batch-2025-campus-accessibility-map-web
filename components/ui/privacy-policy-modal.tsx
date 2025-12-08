'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface PrivacyPolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 z-[4000]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-m3-surface rounded-lg border border-m3-outline overflow-hidden flex flex-col relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-m3-outline flex-shrink-0 flex items-center justify-between bg-m3-surface">
          <h2 className="text-2xl sm:text-3xl font-bold text-m3-primary">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-m3-surface hover:bg-m3-surface-variant text-m3-on-surface flex items-center justify-center shadow-lg border border-m3-outline transition-all hover:scale-110 flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="space-y-6 text-m3-on-surface max-w-none">
            <p className="text-sm text-m3-on-surface-variant">
              <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">1. Introduction</h3>
              <p>
                This Privacy Policy describes how the Campus Accessibility Map ("we", "our", or "the application") 
                collects, uses, and protects your personal information when you use our web application. This 
                application is designed to help map and share accessibility features across campus.
              </p>
              <p>
                By using this application, you agree to the collection and use of information in accordance with 
                this policy.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">2. Information We Collect</h3>
              
              <h4 className="text-xl font-medium text-m3-primary">2.1 Account Information</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Email Address:</strong> Required for account creation and authentication</li>
                <li><strong>Password:</strong> Encrypted and stored securely (we cannot see your password)</li>
                <li><strong>Display Name:</strong> Optional name you choose to display on your profile</li>
                <li><strong>Profile Picture:</strong> Optional avatar image you upload</li>
              </ul>

              <h4 className="text-xl font-medium text-m3-primary mt-4">2.2 Content You Create</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Accessibility Features:</strong> Markers you create with location data, descriptions, and photos</li>
                <li><strong>Comments:</strong> Comments you post on accessibility features</li>
                <li><strong>Photos:</strong> Images you upload for features or your profile</li>
                <li><strong>Building Information:</strong> Building data you contribute (admin users only)</li>
              </ul>

              <h4 className="text-xl font-medium text-m3-primary mt-4">2.3 Usage Data</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Interactions:</strong> Features you like, comments you make, content you view</li>
                <li><strong>Theme Preferences:</strong> Your theme and contrast level selections (stored locally in your browser)</li>
                <li><strong>Location Data:</strong> Geographic coordinates of features you create or view</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">3. How We Use Your Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and maintain the application</li>
                <li>To authenticate your account and manage your profile</li>
                <li>To display your contributions (features, comments) on the map and your profile</li>
                <li>To enable moderation and reporting features</li>
                <li>To improve the application and user experience</li>
                <li>To respond to your requests and support needs</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">4. Data Storage and Security</h3>
              <p>
                Your data is stored securely using <strong>Supabase</strong>, a cloud-based platform that provides:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encrypted data transmission (HTTPS)</li>
                <li>Secure database storage with Row Level Security (RLS) policies</li>
                <li>Encrypted password storage (we never see your actual password)</li>
                <li>Regular security updates and monitoring</li>
              </ul>
              <p>
                While we implement security measures, no method of transmission over the internet or electronic 
                storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">5. Data Sharing and Disclosure</h3>
              <p>We do not sell, trade, or rent your personal information to third parties.</p>
              
              <h4 className="text-xl font-medium text-m3-primary mt-4">5.1 Public Information</h4>
              <p>The following information is publicly visible to all users:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your display name and profile picture (if set)</li>
                <li>Accessibility features you create (including location, description, and photos)</li>
                <li>Comments you post on features</li>
                <li>Your profile page showing your contributions</li>
              </ul>

              <h4 className="text-xl font-medium text-m3-primary mt-4">5.2 Third-Party Services</h4>
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supabase:</strong> For authentication, database, and file storage</li>
                <li><strong>Vercel:</strong> For hosting the application (if deployed)</li>
                <li><strong>OpenStreetMap:</strong> For map tiles (no personal data shared)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">6. Your Rights and Choices</h3>
              <p>You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> View your profile and all data associated with your account</li>
                <li><strong>Update:</strong> Edit your display name, profile picture, and account settings</li>
                <li><strong>Delete:</strong> Delete your account and all associated data through the Settings page</li>
                <li><strong>Content Control:</strong> Edit or delete features and comments you created</li>
              </ul>
              <p>
                To exercise these rights, use the Settings page in the application or contact us directly.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">7. Cookies and Local Storage</h3>
              <p>We use the following local storage mechanisms:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Theme Preferences:</strong> Your theme, dark mode, and contrast level selections are stored in your browser's localStorage</li>
                <li><strong>Remember Me:</strong> Optional cookie to keep you signed in (30 days)</li>
                <li><strong>Session Data:</strong> Authentication tokens managed by Supabase</li>
              </ul>
              <p>
                You can clear this data at any time through your browser settings. Clearing localStorage will 
                reset your theme preferences.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">8. Moderation and Reporting</h3>
              <p>
                Users can report inappropriate content. Administrators have access to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>View all reports and reported content</li>
                <li>Resolve or delete reported content</li>
                <li>View deleted content for moderation purposes</li>
              </ul>
              <p>
                Content may be soft-deleted (hidden from public view) while remaining in the database for 
                moderation review.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">9. Children's Privacy</h3>
              <p>
                This application is intended for use by university students, faculty, and staff. We do not 
                knowingly collect personal information from children under 13. If you are a parent or guardian 
                and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">10. Changes to This Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this 
                Privacy Policy are effective when they are posted on this page.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-m3-primary">11. Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your rights, please 
                contact us through the github repository.
              </p>
              <p className="text-m3-on-surface-variant text-sm">
                This Privacy Policy is designed to comply with applicable privacy laws and regulations, including 
                GDPR, CCPA, and other relevant data protection standards.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

