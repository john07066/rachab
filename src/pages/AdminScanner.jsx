import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { saveOfflineAttendance } from '../lib/indexedDB';
import { Camera, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';

export default function AdminScanner() {
    const { profile } = useAuth();
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        fetchActiveSession();

        return () => {
            // Cleanup scanner on unmount
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    const fetchActiveSession = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('sessions')
                .select('*')
                .eq('is_active', true)
                .single();

            setActiveSession(data || null);
        } catch (err) {
            console.error('Error fetching active session:', err);
        } finally {
            setLoading(false);
        }
    };

    const startScanner = () => {
        setIsScanning(true);
        setScanResult(null);

        // Give the DOM a moment to render the reader div
        setTimeout(() => {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        /* verbose= */ false
            );

            scannerRef.current.render(onScanSuccess, onScanFailure);
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().then(() => {
                setIsScanning(false);
            }).catch(console.error);
        }
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        // Stop scanning immediately to prevent multiple hits
        stopScanner();

        if (!activeSession) {
            setScanResult({ type: 'error', message: 'No active session found.' });
            return;
        }

        try {
            setScanResult({ type: 'processing', message: 'Marking attendance...' });

            // The decodedText should be the user's UUID
            const userId = decodedText;

            // Check if user exists first to get their name
            const { data: userProfile, error: userError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', userId)
                .single();

            if (userError || !userProfile) {
                setScanResult({ type: 'error', message: 'Invalid or unrecognized QR Code.' });
                return;
            }

            // Mark attendance
            const { error: attendanceError } = await supabase
                .from('attendance')
                .insert([{
                    session_id: activeSession.id,
                    profile_id: userId,
                    marked_by: profile.id
                }]);

            if (attendanceError) {
                if (attendanceError.code === '23505') {
                    setScanResult({ type: 'error', message: `${userProfile.full_name} is already marked present!` });
                } else {
                    throw attendanceError;
                }
            } else {
                setScanResult({ type: 'success', message: `${userProfile.full_name} marked present successfully!` });
            }

        } catch (err) {
            console.error('Scan handling error:', err);

            // OFFLINE FALLBACK
            // If the error was network related (Failed to fetch) or similar, save to IndexedDB
            if (!window.navigator.onLine || err.message === 'Failed to fetch' || err.message.includes('network')) {
                await saveOfflineAttendance({
                    session_id: activeSession.id,
                    profile_id: decodedText,
                    marked_by: profile.id
                });

                setScanResult({
                    type: 'success',
                    message: `Saved offline! Will sync when connection is restored.`,
                    icon: <WifiOff size={64} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
                });
            } else {
                setScanResult({ type: 'error', message: 'Failed to record attendance. ' + err.message });
            }
        }
    };

    const onScanFailure = (error) => {
        // html5-qrcode calls this frequently when no QR is in frame. Ignore it.
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>QR Code Scanner</h1>
                {activeSession ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                        Active: {activeSession.name}
                    </div>
                ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                        <AlertCircle size={16} />
                        No active session
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                {!activeSession ? (
                    <div style={{ color: 'var(--text-muted)' }}>
                        Start an active session on the Dashboard to begin scanning.
                    </div>
                ) : (
                    <>
                        <div id="reader" style={{ width: '100%', maxWidth: '400px', display: isScanning ? 'block' : 'none', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--primary)' }}></div>

                        {!isScanning && !scanResult && (
                            <div style={{ padding: '2rem' }}>
                                <Camera size={64} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                <h3 style={{ marginBottom: '1.5rem' }}>Ready to Scan</h3>
                                <button onClick={startScanner} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                                    Open Camera
                                </button>
                            </div>
                        )}

                        {scanResult && (
                            <div className="animate-fade-in" style={{ padding: '2rem', width: '100%' }}>
                                {scanResult.type === 'processing' && (
                                    <div style={{ color: 'var(--primary)' }}>Processing...</div>
                                )}

                                {scanResult.type === 'success' && (
                                    <div>
                                        {scanResult.icon || <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1rem' }} />}
                                        <h3 style={{ color: scanResult.icon ? 'var(--warning)' : 'var(--success)', marginBottom: '1.5rem' }}>
                                            {scanResult.icon ? 'Offline Queue' : 'Success!'}
                                        </h3>
                                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{scanResult.message}</p>
                                        <button onClick={startScanner} className="btn btn-primary">
                                            Scan Next
                                        </button>
                                    </div>
                                )}

                                {scanResult.type === 'error' && (
                                    <div>
                                        <AlertCircle size={64} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
                                        <h3 style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>Error</h3>
                                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{scanResult.message}</p>
                                        <button onClick={startScanner} className="btn btn-secondary" style={{ marginRight: '1rem' }}>
                                            Try Again
                                        </button>
                                        <button onClick={() => setScanResult(null)} className="btn btn-secondary">
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {isScanning && (
                            <button
                                onClick={stopScanner}
                                className="btn btn-secondary"
                                style={{ marginTop: '1.5rem' }}
                            >
                                Cancel Scanning
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* CSS adjustments for the html5-qrcode injected elements to fit our dark theme */}
            <style>{`
        #reader { background: rgba(0,0,0,0.5); }
        #reader__dashboard_section_csr button {
          background: var(--primary) !important;
          color: white !important;
          border: none !important;
          padding: 0.5rem 1rem !important;
          border-radius: 8px !important;
          font-family: var(--font-family) !important;
          cursor: pointer;
        }
        #reader__dashboard_section_swaplink { color: white !important; }
      `}</style>
        </div>
    );
}
