import React, { useEffect, useState } from 'react';

const Nginx504: React.FC = () => {
  const [rayId, setRayId] = useState('');
  const [utcTime, setUtcTime] = useState('');
  const [hostname, setHostname] = useState('domain.com');

  useEffect(() => {
    // Generate a realistic 16-hex character Ray ID
    const hex = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 16; i++) {
      id += hex[Math.floor(Math.random() * 16)];
    }
    setRayId(id);

    // Format current time as YYYY-MM-DD HH:mm:ss UTC
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const min = String(now.getUTCMinutes()).padStart(2, '0');
    const ss = String(now.getUTCSeconds()).padStart(2, '0');
    setUtcTime(`${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} UTC`);

    // Dynamically retrieve the current host domain
    if (window.location.hostname) {
      setHostname(window.location.hostname);
    }
  }, []);

  return (
    <div style={{
      backgroundColor: '#fff',
      color: '#333',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 99999,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left'
    }}>
      {/* Top Part (White Background) */}
      <div style={{
        padding: '70px 40px 50px 40px',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontSize: '64px',
          fontWeight: 300,
          margin: '0 0 16px 0',
          color: '#323133',
          letterSpacing: '-1px'
        }}>
          Error 504
        </h1>
        <div style={{
          fontSize: '14px',
          color: '#8c8b8d',
          fontFamily: 'monospace',
          marginBottom: '20px',
          letterSpacing: '0.3px'
        }}>
          Ray ID: {rayId} &bull; {utcTime}
        </div>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 300,
          margin: '0',
          color: '#8c8b8d'
        }}>
          Gateway timeout
        </h2>
      </div>

      {/* Divider Line */}
      <div style={{
        borderBottom: '1px solid #dedede',
        width: '100%'
      }} />

      {/* Bottom Part (Gray Background) */}
      <div style={{
        backgroundColor: '#f3f2f2',
        flex: 1,
        width: '100%',
        padding: '60px 40px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'nowrap',
          gap: '20px'
        }}>
          
          {/* Node 1: Browser */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            textAlign: 'center'
          }}>
            <div style={{ position: 'relative', width: '130px', height: '110px', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 100 100" width="100" height="100">
                {/* Outlined Browser Icon */}
                <rect x="10" y="20" width="80" height="60" rx="8" fill="#d2d2d4" stroke="#9b9b9d" strokeWidth="4" />
                <line x1="10" y1="36" x2="90" y2="36" stroke="#9b9b9d" strokeWidth="4" />
                <circle cx="20" cy="28" r="3" fill="#fff" />
                <circle cx="30" cy="28" r="3" fill="#fff" />
                <circle cx="40" cy="28" r="3" fill="#fff" />
                
                {/* Green Working Badge */}
                <circle cx="50" cy="80" r="16" fill="#7cb342" stroke="#f3f2f2" strokeWidth="3" />
                <path d="M44 80 l4 4 l8 -8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            <div style={{ fontSize: '18px', color: '#666', marginTop: '15px' }}>You</div>
            <div style={{ fontSize: '24px', fontWeight: 300, color: '#333', marginTop: '5px' }}>Browser</div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: '#7cb342', marginTop: '5px' }}>Working</div>
          </div>

          {/* Double-Headed Arrow 1 */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" width="60" height="60">
              <path d="M10 50 h80 M20 40 l-10 10 l10 10 M80 40 l10 10 l-10 10" stroke="#9b9b9d" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Node 2: Cloudflare */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            textAlign: 'center'
          }}>
            <div style={{ position: 'relative', width: '130px', height: '110px', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 100 100" width="100" height="100">
                {/* Outlined Cloud Icon */}
                <path d="M25 60 a 15 15 0 0 1 12 -25 a 20 20 0 0 1 38 -6 a 15 15 0 0 1 10 31 h -60 z" fill="#b4b4b6" stroke="#9b9b9d" strokeWidth="4" strokeLinejoin="round" />
                
                {/* Green Working Badge */}
                <circle cx="50" cy="80" r="16" fill="#7cb342" stroke="#f3f2f2" strokeWidth="3" />
                <path d="M44 80 l4 4 l8 -8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            <div style={{ fontSize: '18px', color: '#666', marginTop: '15px' }}>Singapore</div>
            <div style={{ fontSize: '24px', fontWeight: 300, color: '#333', marginTop: '5px' }}>Cloudflare</div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: '#7cb342', marginTop: '5px' }}>Working</div>
          </div>

          {/* Double-Headed Arrow 2 */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" width="60" height="60">
              <path d="M10 50 h80 M20 40 l-10 10 l10 10 M80 40 l10 10 l-10 10" stroke="#9b9b9d" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Node 3: Host */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            textAlign: 'center'
          }}>
            <div style={{ position: 'relative', width: '130px', height: '110px', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 100 100" width="100" height="100">
                {/* Outlined Rack Server Icon */}
                <rect x="10" y="30" width="80" height="40" rx="8" fill="#d2d2d4" stroke="#9b9b9d" strokeWidth="4" />
                <circle cx="80" cy="50" r="4" fill="#fff" />
                <circle cx="70" cy="50" r="2" fill="#fff" />
                
                {/* Red Error Badge */}
                <circle cx="50" cy="80" r="16" fill="#e53935" stroke="#f3f2f2" strokeWidth="3" />
                <line x1="44" y1="74" x2="56" y2="86" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                <line x1="56" y1="74" x2="44" y2="86" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            
            <div style={{ fontSize: '18px', color: '#666', marginTop: '15px', wordBreak: 'break-all' }}>{hostname}</div>
            <div style={{ fontSize: '24px', fontWeight: 300, color: '#333', marginTop: '5px' }}>Host</div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: '#e53935', marginTop: '5px' }}>Error</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Nginx504;
