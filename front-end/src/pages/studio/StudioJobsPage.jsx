import { ArrowRight, Mail, RefreshCcw, Trash2 } from 'lucide-react'
import { TextAreaField, TextField } from '../../components/Field'
import { useStorefront } from '../../storefront/StorefrontContext'

export function StudioJobsPage() {
  const { jobForm, setJobForm, jobId, setJobId, emailPreview, loadJobPreview, sendEmailJob, deleteJob, runWelcome } = useStorefront()

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Jobs</h2>
            <p>Schedule notification jobs and inspect the basket email preview.</p>
          </div>
        </div>

        <div className="splitView">
          <div className="pane">
            <div className="formGrid">
              <TextField label="Email" value={jobForm.email} onChange={(value) => setJobForm((current) => ({ ...current, email: value }))} />
              <TextField label="Subject" value={jobForm.subject} onChange={(value) => setJobForm((current) => ({ ...current, subject: value }))} />
              <TextField label="Enqueue" type="datetime-local" value={jobForm.enqueue} onChange={(value) => setJobForm((current) => ({ ...current, enqueue: value }))} />
              <TextField label="Job id" value={jobId} onChange={setJobId} />
              <TextAreaField label="Content" value={jobForm.content} onChange={(value) => setJobForm((current) => ({ ...current, content: value }))} />
            </div>

            <div className="stackButtons">
              <button type="button" className="ghostButton" onClick={loadJobPreview}>
                <Mail size={16} />
                <span>Email preview</span>
              </button>
              <button type="button" className="primaryButton" onClick={sendEmailJob}>
                <RefreshCcw size={16} />
                <span>Schedule email</span>
              </button>
              <button type="button" className="ghostButton danger" onClick={deleteJob}>
                <Trash2 size={16} />
                <span>Delete job</span>
              </button>
            </div>

            <div className="stackButtons">
              <button type="button" className="ghostButton" onClick={() => runWelcome('welcome')}>
                <ArrowRight size={16} />
                <span>Welcome</span>
              </button>
              <button type="button" className="ghostButton" onClick={() => runWelcome('delayedwelcome')}>
                <ArrowRight size={16} />
                <span>Delayed</span>
              </button>
              <button type="button" className="ghostButton" onClick={() => runWelcome('welcomeat')}>
                <ArrowRight size={16} />
                <span>At time</span>
              </button>
              <button type="button" className="ghostButton" onClick={() => runWelcome('confirmedwelcome')}>
                <ArrowRight size={16} />
                <span>Confirmed</span>
              </button>
            </div>
          </div>

          <div className="pane">
            <div className="sectionHeader compact">
              <div>
                <h3>Preview</h3>
                <p>Current HTML body returned by the basket email endpoint.</p>
              </div>
            </div>
            {emailPreview ? <pre className="codeBlock">{emailPreview}</pre> : <div className="emptyState">Load a preview to inspect the template.</div>}
          </div>
        </div>
      </section>
    </div>
  )
}

