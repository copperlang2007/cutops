import { useEffect, useState } from 'react';

interface ElectricTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  isDark?: boolean;
}

export function ElectricText({ text, className = '', style = {}, isDark = false }: ElectricTextProps) {
  const [traced, setTraced] = useState(false);

  useEffect(() => {
    // Mark all letters as traced after animation completes
    const timer = setTimeout(() => {
      setTraced(true);
    }, 3000); // Animation completes around 2.5s, add buffer

    return () => clearTimeout(timer);
  }, []);

  // Split text into letters, preserving spaces and line breaks
  const renderLetters = () => {
    const lines = text.split('\n');
    let letterIndex = 0;

    return lines.map((line, lineIdx) => (
      <span key={`line-${lineIdx}`}>
        {lineIdx > 0 && <span className="electric-break" />}
        {line.split('').map((char, charIdx) => {
          if (char === ' ') {
            return <span key={`space-${lineIdx}-${charIdx}`} className="electric-space" />;
          }
          
          const currentIndex = letterIndex++;
          return (
            <span
              key={`letter-${lineIdx}-${charIdx}-${currentIndex}`}
              className={`electric-letter ${traced ? (isDark ? 'traced' : 'traced-light') : ''}`}
            >
              {char}
            </span>
          );
        })}
      </span>
    ));
  };

  return (
    <h1 className={className} style={style}>
      {renderLetters()}
    </h1>
  );
}
