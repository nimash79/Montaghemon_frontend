// LivePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";

const WS_URL = "ws://localhost:3001"; // در production باید wss:// باشد

export default function LivePage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const role = params.get("role") || "viewer"; // "broadcaster" | "viewer"

  const wsRef = useRef(null);
  const deviceRef = useRef(null);

  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);

  const producerIdRef = useRef(null);
  const consumerIdRef = useRef(null);

  const audioRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  function send(msg) {
    wsRef.current?.send(JSON.stringify(msg));
  }

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setStatus("ws-connected");
    ws.onclose = () => setStatus("ws-closed");

    ws.onmessage = async (evt) => {
      const msg = JSON.parse(evt.data);

      try {
        switch (msg.action) {
          case "welcome":
            // role را مشخص کن
            send({ action: "setRole", data: { role } });
            // rtpCaps router را بگیر
            send({ action: "getRouterRtpCapabilities" });
            break;

          case "routerRtpCapabilities": {
            const routerRtpCapabilities = msg.data;

            const device = new mediasoupClient.Device();
            await device.load({ routerRtpCapabilities });
            deviceRef.current = device;

            setStatus("device-loaded");

            if (role === "broadcaster") {
              await startBroadcast();
            } else {
              await startViewing();
            }
            break;
          }

          case "webRtcTransportCreated": {
            const { direction, id, iceParameters, iceCandidates, dtlsParameters } = msg.data;
            const device = deviceRef.current;

            const transport =
              direction === "send"
                ? device.createSendTransport({ id, iceParameters, iceCandidates, dtlsParameters })
                : device.createRecvTransport({ id, iceParameters, iceCandidates, dtlsParameters });

            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
              send({ action: "connectTransport", data: { transportId: transport.id, dtlsParameters } });
              callback();
            });

            if (direction === "send") {
              transport.on("produce", ({ kind, rtpParameters }, callback, errback) => {
                send({
                  action: "produce",
                  data: { transportId: transport.id, kind, rtpParameters },
                });

                // پاسخ produced از سرور را ساده نگرفته‌ایم؛
                // برای مینیمال بودن، callback را سریع صدا می‌زنیم و producerId را بعداً از پیام produced می‌گیریم.
                callback({ id: "temp" });
              });

              sendTransportRef.current = transport;
              setStatus("send-transport-ready");
            } else {
              recvTransportRef.current = transport;
              setStatus("recv-transport-ready");
            }
            break;
          }

          case "produced":
            producerIdRef.current = msg.data.producerId;
            setStatus("producing");
            break;

          case "newProducer": {
            // بیننده وقتی producer آماده شد consume می‌کند
            if (role !== "viewer") break;
            const producerId = msg.data.producerId;
            await consumeProducer(producerId);
            break;
          }

          case "consumed": {
            // ایجاد consumer سمت کلاینت
            const { consumerId, kind, rtpParameters, producerId } = msg.data;
            consumerIdRef.current = consumerId;

            const consumer = await recvTransportRef.current.consume({
              id: consumerId,
              producerId,
              kind,
              rtpParameters,
            });

            const stream = new MediaStream([consumer.track]);
            audioRef.current.srcObject = stream;

            // تلاش برای پخش
            audioRef.current.play().catch(() => {});

            // حالا resume
            send({ action: "resume", data: { consumerId } });

            setStatus("playing");
            break;
          }

          case "producerClosed":
            setStatus("producer-closed");
            if (audioRef.current) audioRef.current.srcObject = null;
            break;

          case "error":
            setErr(msg.data?.message || "unknown error");
            break;

          default:
            break;
        }
      } catch (e) {
        setErr(e.message);
      }
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startBroadcast() {
    setStatus("starting-broadcast");

    // transport send بساز
    send({ action: "createWebRtcTransport", data: { direction: "send" } });

    // صبر تا transport ساخته شود
    await waitUntil(() => sendTransportRef.current);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const track = stream.getAudioTracks()[0];

    // produce
    await sendTransportRef.current.produce({ track });

    setStatus("broadcasting");
  }

  async function startViewing() {
    setStatus("starting-viewer");

    // transport recv بساز
    send({ action: "createWebRtcTransport", data: { direction: "recv" } });

    await waitUntil(() => recvTransportRef.current);

    setStatus("viewer-ready");
    // اگر producer قبلاً وجود داشته باشد، سرور newProducer را می‌فرستد.
  }

  async function consumeProducer(producerId) {
    if (!deviceRef.current || !recvTransportRef.current) return;

    send({
      action: "consume",
      data: {
        transportId: recvTransportRef.current.id,
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      },
    });
  }

  function waitUntil(fn, interval = 50, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const t = setInterval(() => {
        if (fn()) {
          clearInterval(t);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(t);
          reject(new Error("timeout"));
        }
      }, interval);
    });
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Live Audio ({role})</h2>
      <div>Status: {status}</div>
      {err ? <pre style={{ color: "red" }}>{err}</pre> : null}

      {/* برای viewer */}
      <audio ref={audioRef} controls autoPlay />

      {/* نکته: برای broadcaster نیازی به audio element نیست */}
      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
        برای تست: <code>?role=broadcaster</code> در یک تب، و <code>?role=viewer</code> در تب/دستگاه‌های دیگر
      </div>
    </div>
  );
}