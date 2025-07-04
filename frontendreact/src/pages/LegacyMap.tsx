import React, { useEffect } from 'react';

const LegacyMap: React.FC = () => {
  useEffect(() => {
    // Add a class to the body for the map page to help with full height styling
    document.body.classList.add('legacy-map-embed');
    return () => {
      document.body.classList.remove('legacy-map-embed');
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: '#f8f8f8' }}>
      <style>{`
        html, body, #root, .legacy-map-embed, .legacy-map-embed > div, .legacy-map-embed main {
          height: 100% !important;
          min-height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        .legacy-map-embed main {
          padding: 0 !important;
        }
      `}</style>
      <iframe
        src="/map.html"
        style={{ width: '100vw', height: '100vh', border: 'none', display: 'block', background: '#f8f8f8' }}
        title="Legacy Map"
        allowFullScreen
      />
    </div>
  );
};

export default LegacyMap; 