const mockTranscript = [
  { start: 12, end: 38, text: 'Most people stay poor because they optimize for looking rich, not becoming rich.' },
  { start: 40, end: 72, text: 'A billionaire taught me this: your calendar is your bank account in disguise.' },
  { start: 77, end: 102, text: 'I lost 40 million dollars in one year, and that pain taught me cash flow beats ego.' },
  { start: 110, end: 145, text: 'The ultra-wealthy buy time first. They hire before they feel ready.' },
  { start: 160, end: 189, text: 'If your friends mock your ambition, your environment is silently taxing your income.' },
  { start: 196, end: 226, text: 'My morning starts with 90 minutes of deep work before I touch my phone.' },
  { start: 230, end: 265, text: 'Most people chase seven streams of income. Millionaires master one before scaling.' },
  { start: 270, end: 302, text: 'Your self-image sets your financial thermostat. Until it changes, your income snaps back.' }
];

export async function getTranscriptForVideo(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid YouTube URL is required');
  }

  const match = url.match(/v=([\w-]+)/);
  const id = match?.[1] ?? `local-${Math.abs(hashString(url))}`;

  return {
    video: {
      id,
      title: 'Psychology of Ultra-Wealth: Hidden Rules',
      durationSeconds: 302,
      sourceUrl: url
    },
    segments: mockTranscript
  };
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
