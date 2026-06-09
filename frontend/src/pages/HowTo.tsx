/**
 * HowTo page — static help content rendered as a single-expand accordion.
 * Topics: uploading reports, reading BI-RADS scores (0–6 reference table),
 * using the treatment comparison tool, and understanding AI limitations.
 * Leads with a prominent medical disclaimer banner. No data fetching.
 */
import { useState } from 'react';
import { Icon } from '@/components/ui';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

const ACCORDION_ITEMS: AccordionItem[] = [
  {
    id: 'upload',
    title: 'How to Upload a Report',
    content: (
      <div style={{ lineHeight: 1.6, color: 'var(--fg-2)' }}>
        <p><strong>Step 1: Navigate to a Patient</strong></p>
        <p>Go to the Patients section and select the patient whose report you want to upload.</p>

        <p style={{ marginTop: 12 }}><strong>Step 2: Upload Report</strong></p>
        <p>Click the "Upload Report" button in the Reports tab. This will open the upload dialog.</p>

        <p style={{ marginTop: 12 }}><strong>Step 3: Select File</strong></p>
        <p>Choose a PDF file containing the radiology report. Supported formats include standard radiology reports from DICOM viewers and medical imaging systems.</p>

        <p style={{ marginTop: 12 }}><strong>Step 4: Automatic Processing</strong></p>
        <p>After upload, the system will automatically:</p>
        <ul style={{ marginTop: 8, marginLeft: 20 }}>
          <li>Extract text from the PDF</li>
          <li>Analyze the report content</li>
          <li>Generate BI-RADS assessment</li>
          <li>Identify key findings and recommendations</li>
        </ul>

        <p style={{ marginTop: 12 }}><strong>Step 5: Review Results</strong></p>
        <p>Once processing is complete, review the extracted findings, BI-RADS score, and recommendations. You can edit fields as needed.</p>

        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>
          💡 <strong>Tip:</strong> Clear, high-quality scans produce better AI analysis results.
        </p>
      </div>
    ),
  },
  {
    id: 'birads',
    title: 'How to Read BI-RADS Scores',
    content: (
      <div style={{ lineHeight: 1.6, color: 'var(--fg-2)' }}>
        <p>
          <strong>BI-RADS</strong> (Breast Imaging-Reporting and Data System) is a standardized classification system used to categorize breast imaging findings and recommend follow-up actions.
        </p>

        <table style={{
          marginTop: 16,
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-2)' }}>
              <th style={{ textAlign: 'left', padding: 8, fontWeight: 600 }}>Score</th>
              <th style={{ textAlign: 'left', padding: 8, fontWeight: 600 }}>Category</th>
              <th style={{ textAlign: 'left', padding: 8, fontWeight: 600 }}>Meaning</th>
              <th style={{ textAlign: 'left', padding: 8, fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-1)' }}>
              <td style={{ padding: 8, fontWeight: 600 }}>0</td>
              <td style={{ padding: 8 }}>Incomplete</td>
              <td style={{ padding: 8 }}>Assessment incomplete</td>
              <td style={{ padding: 8 }}>Need additional imaging</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-1)' }}>
              <td style={{ padding: 8, fontWeight: 600 }}>1</td>
              <td style={{ padding: 8 }}>Negative</td>
              <td style={{ padding: 8 }}>No findings</td>
              <td style={{ padding: 8 }}>Routine screening</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-1)' }}>
              <td style={{ padding: 8, fontWeight: 600 }}>2</td>
              <td style={{ padding: 8 }}>Benign</td>
              <td style={{ padding: 8 }}>Benign findings</td>
              <td style={{ padding: 8 }}>Routine screening</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-1)' }}>
              <td style={{ padding: 8, fontWeight: 600 }}>3</td>
              <td style={{ padding: 8 }}>Probably Benign</td>
              <td style={{ padding: 8 }}>Likely benign but needs follow-up</td>
              <td style={{ padding: 8 }}>Short-term follow-up</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-1)' }}>
              <td style={{ padding: 8, fontWeight: 600 }}>4</td>
              <td style={{ padding: 8 }}>Suspicious</td>
              <td style={{ padding: 8 }}>Suspicious for malignancy</td>
              <td style={{ padding: 8 }}>Biopsy recommended</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-1)' }}>
              <td style={{ padding: 8, fontWeight: 600 }}>5</td>
              <td style={{ padding: 8 }}>Malignant</td>
              <td style={{ padding: 8 }}>Highly suggestive of cancer</td>
              <td style={{ padding: 8 }}>Diagnostic action taken</td>
            </tr>
            <tr>
              <td style={{ padding: 8, fontWeight: 600 }}>6</td>
              <td style={{ padding: 8 }}>Known Biopsy</td>
              <td style={{ padding: 8 }}>Proven malignancy</td>
              <td style={{ padding: 8 }}>Treatment planning</td>
            </tr>
          </tbody>
        </table>

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--fg-3)' }}>
          📚 For detailed information, consult the official BI-RADS atlas published by the American College of Radiology (ACR).
        </p>
      </div>
    ),
  },
  {
    id: 'comparison',
    title: 'How to Use Treatment Comparison',
    content: (
      <div style={{ lineHeight: 1.6, color: 'var(--fg-2)' }}>
        <p><strong>Treatment Comparison Tool</strong> helps you evaluate different treatment options side-by-side.</p>

        <p style={{ marginTop: 12 }}><strong>Step 1: Access Comparison</strong></p>
        <p>In the patient's record, navigate to the "Treatment" section and click "Compare Options".</p>

        <p style={{ marginTop: 12 }}><strong>Step 2: Select Treatments</strong></p>
        <p>Choose up to 3 treatment options to compare. The system will show:</p>
        <ul style={{ marginTop: 8, marginLeft: 20 }}>
          <li>Treatment type and duration</li>
          <li>Expected outcomes based on clinical data</li>
          <li>Potential side effects</li>
          <li>Survival statistics</li>
          <li>Quality of life considerations</li>
          <li>Cost estimates (if available)</li>
        </ul>

        <p style={{ marginTop: 12 }}><strong>Step 3: Review Evidence</strong></p>
        <p>Each comparison includes citations to clinical studies and treatment guidelines. Click on evidence items to see source details.</p>

        <p style={{ marginTop: 12 }}><strong>Step 4: Make Informed Decisions</strong></p>
        <p>Use the comparison data to facilitate discussions with the care team about the best treatment approach for the patient's specific situation.</p>

        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'var(--warning-100)',
          border: '1px solid var(--warning-200)',
          borderRadius: 'var(--r-sm)',
          color: 'var(--warning-700)',
          fontSize: 13,
        }}>
          ⚠️ <strong>Important:</strong> This tool is for informational purposes to support clinical decision-making. Treatment decisions must always be made by qualified healthcare professionals in consultation with the patient.
        </div>
      </div>
    ),
  },
  {
    id: 'limitations',
    title: 'Understanding AI Limitations',
    content: (
      <div style={{ lineHeight: 1.6, color: 'var(--fg-2)' }}>
        <p>
          <strong>AI-Assisted Radiology Analysis</strong> is a powerful tool, but it has important limitations that must be understood:
        </p>

        <p style={{ marginTop: 12 }}><strong>What AI Can Do</strong></p>
        <ul style={{ marginTop: 8, marginLeft: 20 }}>
          <li>Rapidly extract and organize text from reports</li>
          <li>Identify key clinical findings and measurements</li>
          <li>Suggest standardized classifications (BI-RADS)</li>
          <li>Flag potential areas of concern for review</li>
          <li>Provide consistent documentation</li>
        </ul>

        <p style={{ marginTop: 12 }}><strong>What AI Cannot Do</strong></p>
        <ul style={{ marginTop: 8, marginLeft: 20 }}>
          <li><strong>Replace Radiologists:</strong> AI is not a substitute for expert radiologist interpretation</li>
          <li><strong>View Images:</strong> This system analyzes reports, not raw imaging data</li>
          <li><strong>Make Diagnoses:</strong> Diagnosis requires clinical expertise and judgment</li>
          <li><strong>Guarantee Accuracy:</strong> AI can make mistakes; all findings must be verified</li>
          <li><strong>Account for Context:</strong> Clinical history and patient factors require human understanding</li>
        </ul>

        <p style={{ marginTop: 12 }}><strong>Best Practices</strong></p>
        <ul style={{ marginTop: 8, marginLeft: 20 }}>
          <li>Always review AI-generated content before relying on it</li>
          <li>Verify key findings against the original report</li>
          <li>Use AI as an assistant to enhance efficiency, not replace expertise</li>
          <li>Maintain human oversight of all clinical decisions</li>
          <li>Report any discrepancies or errors for system improvement</li>
        </ul>

        <p style={{ marginTop: 12 }}><strong>Accuracy and Limitations</strong></p>
        <p>
          The AI model used in this system is trained on clinical data but may:
        </p>
        <ul style={{ marginTop: 8, marginLeft: 20 }}>
          <li>Perform differently on unusual or complex cases</li>
          <li>Struggle with handwritten or poor-quality documents</li>
          <li>Miss rare findings or atypical presentations</li>
          <li>Be influenced by biases in training data</li>
        </ul>

        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'var(--error-100)',
          border: '1px solid var(--error-200)',
          borderRadius: 'var(--r-sm)',
          color: 'var(--error-700)',
          fontSize: 13,
        }}>
          🚨 <strong>Critical:</strong> This tool is for clinical support only. All diagnostic and treatment decisions must be made by licensed healthcare professionals. AI output should never be used as the sole basis for patient care decisions.
        </div>
      </div>
    ),
  },
];

export default function HowTo() {
  const [expandedId, setExpandedId] = useState<string | null>('upload');

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <h1 style={{ margin: '0 0 12px 0', fontSize: 32, fontWeight: 700 }}>How to Use RadReport AI</h1>
      <p style={{ margin: '0 0 32px 0', color: 'var(--fg-2)', fontSize: 16, lineHeight: 1.6 }}>
        Comprehensive guides to help you get the most out of our AI-assisted radiology reporting system.
      </p>

      {/* Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ACCORDION_ITEMS.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid var(--border-2)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              background: 'var(--bg-surface)',
            }}
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleAccordion(item.id)}
              style={{
                width: '100%',
                padding: 16,
                background: expandedId === item.id ? 'var(--bg-panel)' : 'var(--bg-surface)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'background 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = expandedId === item.id ? 'var(--bg-panel)' : 'var(--bg-muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = expandedId === item.id ? 'var(--bg-panel)' : 'var(--bg-surface)';
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, textAlign: 'left', color: 'var(--fg-1)' }}>
                {item.title}
              </h2>
              <Icon
                name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                style={{ color: 'var(--fg-3)', flexShrink: 0 }}
              />
            </button>

            {/* Accordion Content */}
            {expandedId === item.id && (
              <div style={{
                padding: 20,
                borderTop: '1px solid var(--border-2)',
                background: 'var(--bg-surface)',
              }}>
                {item.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 40,
        paddingTop: 24,
        borderTop: '1px solid var(--border-2)',
        textAlign: 'center',
        color: 'var(--fg-3)',
        fontSize: 13,
      }}>
        <p>
          Have questions? Contact support or consult with your system administrator.
        </p>
        <p style={{ margin: '8px 0 0 0' }}>
          Last updated: June 2026 | Version 1.0
        </p>
      </div>

      {/* Medical Disclaimer */}
      <div style={{
        padding: 20,
        background: 'var(--error-50)',
        border: '2px solid var(--error-300)',
        borderRadius: 'var(--r-md)',
        marginTop: 32,
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <Icon name="alert-triangle" size={24} style={{ color: 'var(--error-600)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--error-900)', fontSize: 16, fontWeight: 600 }}>
              Medical Disclaimer
            </h3>
            <p style={{ margin: 0, color: 'var(--error-800)', fontSize: 14, lineHeight: 1.6 }}>
              <strong>This application is for clinical support and educational purposes only.</strong> It is not intended to replace professional medical judgment or diagnosis. All findings, assessments, and recommendations from this system must be reviewed and validated by qualified healthcare professionals. Do not use this tool as the sole basis for patient care decisions. Always consult with appropriate medical specialists before making clinical or treatment decisions. The developers and operators of this application are not responsible for medical decisions made using this tool.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
