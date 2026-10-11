
import { useCallback, useEffect, useRef, useState } from "react";
import "./ReverseVoice.css";

const MAX_SECONDS = 20;

export default function ReverseVoice() {
    const [phase, setPhase] = useState(1);
    const [startingPlayer, setStartingPlayer] = useState(1);
    const [recording, setRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [playing, setPlaying] = useState("");
    const [error, setError] = useState("");
    const [introVisible, setIntroVisible] = useState(true);
    const [introFading, setIntroFading] = useState(false);

    const [originalUrl, setOriginalUrl] = useState("");
    const [reversedUrl, setReversedUrl] = useState("");
    const [imitationUrl, setImitationUrl] = useState("");

    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const secondsRef = useRef(0);
    const urlsRef = useRef([]);
    const phaseRef = useRef(1);
    const tokenRef = useRef(0);
    const startingPlayerRef = useRef(1);

    const listenerPlayer = startingPlayer === 1 ? 2 : 1;

    const theme =
        phase === 4
            ? "rv-reveal"
            : phase === 1
                ? startingPlayer === 1
                    ? "rv-player-one"
                    : "rv-player-two"
                : listenerPlayer === 1
                    ? "rv-player-one"
                    : "rv-player-two";

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        const fadeTimer = window.setTimeout(() => setIntroFading(true), 2000);
        const removeTimer = window.setTimeout(() => setIntroVisible(false), 2500);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(removeTimer);
        };
    }, []);

    const stopTimer = useCallback(() => {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
    }, []);

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setPlaying("");
    }, []);

    useEffect(() => {
        return () => {
            tokenRef.current += 1;
            stopTimer();
            stopStream();

            if (recorderRef.current?.state === "recording") {
                recorderRef.current.onstop = null;
                recorderRef.current.stop();
            }

            audioRef.current?.pause();

            if (audioContextRef.current?.state !== "closed") {
                audioContextRef.current?.close();
            }

            urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [stopStream, stopTimer]);

    function saveUrl(blob) {
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        return url;
    }

    async function playAudio(url, key) {
        if (!url) return;

        setError("");
        stopPlayback();

        try {
            const audio = new Audio(url);
            audioRef.current = audio;
            setPlaying(key);

            audio.onended = () => {
                if (audioRef.current === audio) {
                    audioRef.current = null;
                    setPlaying("");
                }
            };

            audio.onerror = () => {
                if (audioRef.current === audio) {
                    audioRef.current = null;
                    setPlaying("");
                    setError("Audio playback failed. Please try again.");
                }
            };

            await audio.play();
        } catch {
            setPlaying("");
            setError("Playback was blocked. Tap play again.");
        }
    }

    function encodeWav(buffer) {
        const channels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const frames = buffer.length;
        const blockAlign = channels * 2;
        const dataSize = frames * blockAlign;
        const arrayBuffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(arrayBuffer);

        function writeString(offset, value) {
            for (let i = 0; i < value.length; i++) {
                view.setUint8(offset + i, value.charCodeAt(i));
            }
        }

        writeString(0, "RIFF");
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true);
        writeString(36, "data");
        view.setUint32(40, dataSize, true);

        const channelData = Array.from(
            { length: channels },
            (_, channel) => buffer.getChannelData(channel)
        );

        let offset = 44;

        for (let i = 0; i < frames; i++) {
            for (let channel = 0; channel < channels; channel++) {
                const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
                view.setInt16(
                    offset,
                    sample < 0 ? sample * 0x8000 : sample * 0x7fff,
                    true
                );
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: "audio/wav" });
    }

    async function reverseAudio(blob) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error("Audio processing is not supported in this browser.");
        }

        if (!audioContextRef.current || audioContextRef.current.state === "closed") {
            audioContextRef.current = new AudioContextClass();
        }

        const context = audioContextRef.current;

        if (context.state === "suspended") {
            await context.resume();
        }

        const decoded = await context.decodeAudioData(await blob.arrayBuffer());
        const reversed = context.createBuffer(
            decoded.numberOfChannels,
            decoded.length,
            decoded.sampleRate
        );

        for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
            const source = decoded.getChannelData(channel);
            const destination = reversed.getChannelData(channel);

            for (let i = 0; i < source.length; i++) {
                destination[i] = source[source.length - 1 - i];
            }
        }

        return encodeWav(reversed);
    }

    async function startRecording() {
        if (recording || processing) return;

        setError("");
        stopPlayback();

        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            setError("Microphone access requires a supported browser and localhost or HTTPS.");
            return;
        }

        const token = ++tokenRef.current;
        setProcessing(true);

        let stream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            if (token !== tokenRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = stream;
            chunksRef.current = [];

            let mimeType = "";
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                mimeType = "audio/webm;codecs=opus";
            } else if (MediaRecorder.isTypeSupported("audio/webm")) {
                mimeType = "audio/webm";
            }

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            recorderRef.current = recorder;
            secondsRef.current = 0;
            setSeconds(0);

            recorder.ondataavailable = (event) => {
                if (event.data?.size > 0) chunksRef.current.push(event.data);
            };

            recorder.onerror = () => {
                stopTimer();
                stopStream();
                setRecording(false);
                setProcessing(false);
                setError("Recording failed. Please try again.");
            };

            recorder.onstop = async () => {
                stopTimer();
                stopStream();
                setRecording(false);

                if (token !== tokenRef.current) return;

                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || "audio/webm"
                });

                if (!blob.size) {
                    setProcessing(false);
                    setError("No audio was captured. Please record again.");
                    return;
                }

                setProcessing(true);

                try {
                    const reversedBlob = await reverseAudio(blob);
                    if (token !== tokenRef.current) return;

                    const recorded = saveUrl(blob);
                    const reversed = saveUrl(reversedBlob);

                    if (phaseRef.current === 1) {
                        setOriginalUrl(recorded);
                        setReversedUrl(reversed);
                        setPhase(2);
                        phaseRef.current = 2;
                    } else if (phaseRef.current === 3) {
                        setImitationUrl(recorded);
                        setPhase(4);
                        phaseRef.current = 4;
                    }
                } catch (err) {
                    if (token === tokenRef.current) {
                        setError(err?.message || "Could not process audio. Please try again.");
                    }
                } finally {
                    if (token === tokenRef.current) setProcessing(false);
                }
            };

            recorder.start();
            setProcessing(false);
            setRecording(true);

            timerRef.current = window.setInterval(() => {
                secondsRef.current += 1;
                setSeconds(secondsRef.current);

                if (secondsRef.current >= MAX_SECONDS) stopRecording();
            }, 1000);
        } catch (err) {
            stream?.getTracks().forEach((track) => track.stop());

            if (token === tokenRef.current) {
                setRecording(false);
                setProcessing(false);

                if (err?.name === "NotAllowedError") {
                    setError("Microphone permission denied. Allow microphone access and retry.");
                } else if (err?.name === "NotFoundError") {
                    setError("No microphone was found on this device.");
                } else {
                    setError("Could not access your microphone. Check browser permissions.");
                }
            }
        }
    }

    function stopRecording() {
        stopTimer();
        if (recorderRef.current?.state === "recording") {
            recorderRef.current.stop();
        }
    }

    function resetGame() {
        tokenRef.current += 1;
        stopPlayback();
        stopTimer();
        stopStream();

        if (recorderRef.current?.state === "recording") {
            recorderRef.current.onstop = null;
            recorderRef.current.stop();
        }

        urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        urlsRef.current = [];

        const nextPlayer = startingPlayerRef.current === 1 ? 2 : 1;
        startingPlayerRef.current = nextPlayer;
        setStartingPlayer(nextPlayer);

        setPhase(1);
        phaseRef.current = 1;
        setRecording(false);
        setProcessing(false);
        setSeconds(0);
        secondsRef.current = 0;
        setError("");
        setOriginalUrl("");
        setReversedUrl("");
        setImitationUrl("");
    }

    function goHome() {
        window.location.href = "/";
    }

    return (
        <main className={`reverse-voice-page ${theme}`}>
            {introVisible && (
                <div
                    className={`rv-intro ${introFading ? "rv-intro-fade" : ""}`}
                    role="status"
                >
                    <div className="rv-intro-kicker">THE AUDIO GAME</div>
                    <h1>
                        REVERSE
                        <span>VOICE</span>
                    </h1>
                    <p>
                        One voice goes backwards.
                        <br />
                        Can another player bring it back?
                    </p>
                    <div className="rv-intro-line" />
                </div>
            )}

            <header className="rv-topbar">
                <button
                    className="rv-back-button"
                    type="button"
                    onClick={goHome}
                    aria-label="Back to games"
                >
                    ←
                </button>

                <div className="rv-brand">
                    CHICACO <span>VERSE</span>
                </div>

                <button className="rv-exit-button" type="button" onClick={goHome}>
                    EXIT 
                </button>
            </header>

            <section className="rv-game">
                <div className="rv-player-label">
                    <span className="rv-player-dot" />
                    {phase === 1
                        ? `PLAYER ${startingPlayer} · YOUR TURN`
                        : phase === 2
                            ? `PLAYER ${listenerPlayer} · LISTEN CLOSELY`
                            : phase === 3
                                ? `PLAYER ${listenerPlayer} · YOUR TURN`
                                : "THE REVEAL"}
                </div>

                <div className="rv-card" key={phase}>
                    <div className="rv-card-topline">
                        <span>{phase === 4 ? "THE SOUND REVEAL" : `ROUND 0${phase}`}</span>
                        <span className="rv-status">
                            <i />
                            {recording ? "RECORDING" : processing ? "PROCESSING" : "READY"}
                        </span>
                    </div>

                    {phase === 1 && (
                        <>
                            <div className="rv-phase-label">
                                PLAYER {startingPlayer} / RECORD
                            </div>
                            <h2>Say anything.</h2>
                            <p className="rv-instructions">
                                Record a phrase, a word, a laugh, or a random sound.
                                Keep it secret from Player {listenerPlayer}. Maximum 20 seconds.
                            </p>

                            <MicOrb recording={recording} />
                            <Waveform active={recording} />
                            <Timer seconds={seconds} />
                            <Meter seconds={seconds} />

                            {!recording ? (
                                <button
                                    className="rv-primary-button"
                                    onClick={startRecording}
                                    disabled={processing}
                                    type="button"
                                >
                                    {processing ? "PREPARING MICROPHONE..." : "● START RECORDING"}
                                </button>
                            ) : (
                                <button className="rv-stop-button" onClick={stopRecording} type="button">
                                    ■ STOP RECORDING
                                </button>
                            )}

                            <p className="rv-small-note">
                                YOUR RECORDING WILL BE PLAYED BACKWARDS
                            </p>
                        </>
                    )}

                    {phase === 2 && (
                        <>
                            <div className="rv-phase-label">
                                PLAYER {listenerPlayer} / LISTEN
                            </div>
                            <h2>That sounds weird, right?</h2>
                            <p className="rv-instructions">
                                Listen closely to Player {startingPlayer}'s reversed recording.
                                Remember the sound. You will imitate it next.
                            </p>

                            <div className="rv-mic-orb rv-listen-orb">
                                <div className="rv-orb-ring rv-ring-one" />
                                <div className="rv-orb-ring rv-ring-two" />
                                <div className="rv-orb-core">
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M3 12h3l3-7 4 14 3-7h5" />
                                    </svg>
                                </div>
                            </div>

                            <div className="rv-audio-row rv-highlight-row">
                                <div className="rv-audio-icon">↶</div>
                                <div className="rv-audio-info">
                                    <strong>REVERSED RECORDING</strong>
                                    <small>Player {startingPlayer} · Backwards audio</small>
                                </div>
                                <button
                                    className="rv-play-button"
                                    onClick={() => playAudio(reversedUrl, "reversed")}
                                    type="button"
                                    aria-label="Play reversed recording"
                                >
                                    {playing === "reversed" ? "Ⅱ" : "▶"}
                                </button>
                            </div>

                            <p className="rv-warning">
                                Don't reveal the original recording yet. Let Player {listenerPlayer} guess!
                            </p>

                            <button
                                className="rv-primary-button"
                                type="button"
                                onClick={() => {
                                    stopPlayback();
                                    setError("");
                                    setSeconds(0);
                                    secondsRef.current = 0;
                                    setPhase(3);
                                    phaseRef.current = 3;
                                }}
                            >
                                PASS TO PLAYER {listenerPlayer} →
                            </button>
                        </>
                    )}

                    {phase === 3 && (
                        <>
                            <div className="rv-phase-label">
                                PLAYER {listenerPlayer} / IMITATE
                            </div>
                            <h2>Copy that sound.</h2>
                            <p className="rv-instructions">
                                Player {listenerPlayer}, imitate the strange reversed sound.
                                Don't try to figure out the original words. Just copy the sound!
                            </p>

                            <MicOrb recording={recording} />
                            <Waveform active={recording} />
                            <Timer seconds={seconds} />
                            <Meter seconds={seconds} />

                            {!recording ? (
                                <button
                                    className="rv-primary-button"
                                    onClick={startRecording}
                                    disabled={processing}
                                    type="button"
                                >
                                    {processing ? "PREPARING MICROPHONE..." : "● RECORD IMITATION"}
                                </button>
                            ) : (
                                <button className="rv-stop-button" onClick={stopRecording} type="button">
                                    ■ STOP RECORDING
                                </button>
                            )}

                            <p className="rv-small-note">
                                NO PRESSURE. THE WEIRDER, THE BETTER.
                            </p>
                        </>
                    )}

                    {phase === 4 && (
                        <>
                            <div className="rv-phase-label">THE FINAL REVEAL</div>
                            <h2>How close did you get?</h2>
                            <p className="rv-instructions">
                                Listen to the reversed original and Player {listenerPlayer}'s guess.
                                Compare the sounds and enjoy the chaos.
                            </p>

                            <div className="rv-reveal-list">
                                <AudioRow
                                    number="01"
                                    title={`Player ${listenerPlayer}'s guess`}
                                    subtitle="The sound they tried to imitate"
                                    playing={playing === "imitation"}
                                    onClick={() => playAudio(imitationUrl, "imitation")}
                                />
                                <AudioRow
                                    number="02"
                                    title="Reversed original"
                                    subtitle={`Player ${startingPlayer}'s voice played backwards`}
                                    playing={playing === "reversed"}
                                    onClick={() => playAudio(reversedUrl, "reversed")}
                                />
                            </div>

                            <div className="rv-end-note">
                                NO SCORES. NO WINNERS. JUST CHAOS.
                            </div>

                            <div className="rv-finish-actions">
                                <button className="rv-primary-button" onClick={resetGame} type="button">
                                    ↻ PLAY AGAIN
                                </button>
                            </div>
                        </>
                    )}

                    {processing && (
                        <div className="rv-processing" role="status">
                            <span className="rv-spinner" />
                            PROCESSING AUDIO...
                        </div>
                    )}

                    {error && (
                        <div className="rv-error" role="alert">
                            <span>{error}</span>
                            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                                ×
                            </button>
                        </div>
                    )}
                </div>

                <footer className="rv-footer">
                    <span />
                    CHICACO VERSE
                    <span />
                </footer>
            </section>
        </main>
    );
}

function MicOrb({ recording }) {
    return (
        <div className={`rv-mic-orb ${recording ? "rv-recording" : ""}`}>
            <div className="rv-orb-ring rv-ring-one" />
            <div className="rv-orb-ring rv-ring-two" />
            <div className="rv-orb-core">
                {recording ? (
                    <span className="rv-record-dot" />
                ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="9" y="3" width="6" height="12" rx="3" />
                        <path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" />
                    </svg>
                )}
            </div>
        </div>
    );
}

function AudioRow({ number, title, subtitle, playing, onClick }) {
    return (
        <div className="rv-audio-row">
            <div className="rv-audio-icon">{number}</div>
            <div className="rv-audio-info">
                <strong>{title}</strong>
                <small>{subtitle}</small>
            </div>
            <button className="rv-play-button" onClick={onClick} type="button">
                {playing ? "Ⅱ" : "▶"}
            </button>
        </div>
    );
}

function Waveform({ active }) {
    return (
        <div className={`rv-waveform ${active ? "rv-waveform-active" : ""}`} aria-hidden="true">
            {Array.from({ length: 31 }, (_, i) => (
                <span
                    key={i}
                    style={{
                        "--wave-height": `${9 + ((i * 17 + 13) % 31)}px`,
                        "--wave-delay": `${(i % 9) * 0.06}s`
                    }}
                />
            ))}
        </div>
    );
}

function Timer({ seconds }) {
    return (
        <div className="rv-timer">
            <strong>00:{String(seconds).padStart(2, "0")}</strong>
            <span>/ 00:20 SEC</span>
        </div>
    );
}

function Meter({ seconds }) {
    return (
        <div className="rv-recording-meter">
            <span style={{ width: `${(seconds / MAX_SECONDS) * 100}%` }} />
        </div>
    );
}
