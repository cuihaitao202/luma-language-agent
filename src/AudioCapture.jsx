import React, { useEffect, useRef, useState } from "react";
import { Check, Mic, Square, X } from "lucide-react";

const endpoints = () => [
  "https://api.aimodelapi.ai/v1/luma/transcribe",
  "https://sg.api.aimodelapi.ai/v1/luma/transcribe",
];

const toDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

export default function AudioCapture({ open, language, vocabulary = [], close, complete }) {
  const [phase, setPhase] = useState("ready");
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState("");
  const mediaRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!open || phase !== "recording") return undefined;
    const timer = setInterval(() => setSeconds(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [open, phase]);
  useEffect(() => () => streamRef.current?.getTracks?.().forEach(track => track.stop()), []);
  if (!open) return null;

  const stopTracks = () => {
    streamRef.current?.getTracks?.().forEach(track => track.stop());
    streamRef.current = null;
  };
  const dismiss = () => {
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    stopTracks();
    setPhase("ready");
    setSeconds(0);
    setNotice("");
    close();
  };
  const send = async (blob) => {
    setPhase("transcribing");
    setNotice("正在识别完整录音和专业术语…");
    try {
      const audio = await toDataUrl(blob);
      let response;
      let lastError;
      for (const endpoint of endpoints()) {
        try {
          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio, language, vocabulary }),
          });
          if (response.ok || response.status < 500) break;
        } catch (error) { lastError = error; }
      }
      if (!response) throw lastError || new Error("无法连接语音识别服务");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message || `识别失败 (${response.status})`);
      if (!payload.transcript) throw new Error("没有识别到语音，请重录");
      setPhase("done");
      setNotice("完整录音已转写。你可以在文本框中继续修改。 ");
      complete(payload.transcript);
      setTimeout(dismiss, 450);
    } catch (error) {
      setPhase("error");
      setNotice(error?.message || "识别失败，请重试");
    }
  };
  const start = async () => {
    setNotice("");
    setSeconds(0);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const preferred = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
        .find(type => window.MediaRecorder?.isTypeSupported?.(type));
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      recorder.ondataavailable = event => { if (event.data?.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stopTracks();
        if (blob.size < 800) {
          setPhase("error");
          setNotice("没有录到声音，请靠近麦克风重试。");
          return;
        }
        send(blob);
      };
      mediaRef.current = recorder;
      recorder.start(250);
      setPhase("recording");
      setNotice("从第一句话开始完整录音。说完后按停止，不会因停顿而截断。");
    } catch {
      setPhase("error");
      setNotice("无法使用麦克风，请在浏览器设置中允许麦克风权限。");
    }
  };
  const stop = () => {
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
  };

  return (
    <div className="recordingback" role="presentation">
      <section className="recordingdialog" role="dialog" aria-modal="true" aria-label="Record a complete answer">
        <button type="button" className="recordingclose" onClick={dismiss} aria-label="Close"><X /></button>
        <span className="kicker">完整回答 · {language}</span>
        <h2>{phase === "recording" ? "我在听，慢慢说完。" : phase === "transcribing" ? "正在准确转写…" : "准备好后再开始。"}</h2>
        <p>{notice || "按下开始后，可以停顿、思考和继续说；只有你按下停止才结束。"}</p>
        <div className={`recordingpulse ${phase}`}><Mic /><b>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</b></div>
        {phase === "recording" ? (
          <button type="button" className="recordstop" onClick={stop}><Square /> 我说完了，停止并转写</button>
        ) : phase === "transcribing" ? (
          <button type="button" className="primary full" disabled>识别完整录音中…</button>
        ) : phase === "done" ? (
          <button type="button" className="primary full" disabled><Check /> 已完成</button>
        ) : (
          <button type="button" className="primary full" onClick={start}><Mic /> 开始完整录音</button>
        )}
      </section>
    </div>
  );
}
