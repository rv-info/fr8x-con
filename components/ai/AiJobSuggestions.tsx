'use client';

/**
 * AiJobSuggestions — stub component
 * Provides AI-assisted job requirement suggestion functionality.
 * Currently a UI stub that appends pre-defined suggestion text.
 * Full AI integration can be added in a future phase via the Gemini API.
 */

interface AiJobSuggestionsProps {
  onAppend: (text: string) => void;
}

const SUGGESTION_TEMPLATES = [
  'Strong communication and negotiation skills required.',
  'Experience with freight management software (TMS/WMS) preferred.',
  'Knowledge of Incoterms 2020 and international trade documentation essential.',
  'Ability to manage multiple shipments simultaneously under tight deadlines.',
  'Familiarity with customs clearance procedures and trade compliance regulations.',
];

export function AiJobSuggestions({ onAppend }: AiJobSuggestionsProps) {
  if (!onAppend) return null;

  return (
    <div
      style={{
        marginTop: 8,
        padding: '10px 12px',
        background: '#F4F6F8',
        border: '1px solid #D9E0E8',
        borderRadius: 8,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#526174',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 8px 0',
        }}
      >
        AI Suggestions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SUGGESTION_TEMPLATES.map((text, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAppend(text)}
            style={{
              textAlign: 'left',
              background: '#FFFFFF',
              border: '1px solid #D9E0E8',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 12,
              color: '#172B45',
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
          >
            + {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AiJobSuggestions;
