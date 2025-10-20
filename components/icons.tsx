import React from 'react';

// FIX: Create SVG icon components.
const IconBase: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

export const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.22l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0-2.22l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);

export const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </IconBase>
);

export const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </IconBase>
);

export const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </IconBase>
);

export const MicrophoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </IconBase>
);

export const StopIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props} >
        <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
    </IconBase>
);

export const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const BotIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props} strokeWidth="1.5">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M8 16a4 4 0 1 0 8 0h-8z" />
      <path d="M10 12a2 2 0 1 1 4 0a2 2 0 0 1 -4 0z" />
      <path d="M10 12v-2h4v2" />
      <path d="M12 12v-2" />
      <path d="M12 12a9 9 0 0 0 -9 9" />
      <path d="M12 12a9 9 0 0 1 9 9" />
    </IconBase>
);

export const ClipboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </IconBase>
);

export const LightbulbIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M12 2a7 7 0 0 0-7 7c0 3.07 1.667 4.667 3 6h8c1.333-1.333 3-2.93 3-6a7 7 0 0 0-7-7z" />
    <path d="M9 21h6" />
    <path d="M12 17v4" />
  </IconBase>
);

export const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </IconBase>
);

export const PhotographIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </IconBase>
);

export const TableIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="12" y1="3" x2="12" y2="21" />
    </IconBase>
);

export const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <IconBase {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
  </IconBase>
);

export const CollectionIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <IconBase {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M10 3v18" />
        <path d="M3 10h18" />
    </IconBase>
);
