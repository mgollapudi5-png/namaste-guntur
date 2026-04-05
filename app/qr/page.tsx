"use client";

import { useState, useRef, useCallback } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

type QRType = "url" | "phone";
type ImageFormat = "png" | "jpg" | "svg";

export default function QRGeneratorPage() {
  const [type, setType] = useState<QRType>("url");
  const [url, setUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [format, setFormat] = useState<ImageFormat>("png");
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const qrValue = type === "phone" ? `tel:${phone}` : url;
  const isValid = type === "url" ? url.trim() !== "" : phone.trim() !== "";

  const download = useCallback(() => {
    const filename = `qr-${type}-${Date.now()}`;

    if (format === "svg") {
      const svgEl = svgRef.current?.querySelector("svg");
      if (!svgEl) return;
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const link = document.createElement("a");
      link.download = `${filename}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      return;
    }

    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    if (format === "jpg") {
      // JPG doesn't support transparency — flatten onto white first
      const offscreen = document.createElement("canvas");
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const ctx = offscreen.getContext("2d")!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
      ctx.drawImage(canvas, 0, 0);
      const link = document.createElement("a");
      link.download = `${filename}.jpg`;
      link.href = offscreen.toDataURL("image/jpeg", 0.95);
      link.click();
    } else {
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }, [type, format, bgColor]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">QR Code Generator</h1>
        <p className="text-center text-gray-400 text-sm mb-6">Generate &amp; download for links or phone numbers</p>

        {/* Type toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-5">
          {(["url", "phone"] as QRType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === t ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "url" ? "🔗 Web Link" : "📞 Contact Number"}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="mb-4">
          {type === "url" ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          ) : (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 99999 99999"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          )}
        </div>

        {/* Options row */}
        <div className="flex gap-3 mb-5 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Size (px)</label>
            <input
              type="number"
              min={128}
              max={512}
              step={32}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">FG</label>
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">BG</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
            />
          </div>
        </div>

        {/* Format selector */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 mb-1">Download Format</label>
          <div className="flex gap-2">
            {(["png", "jpg", "svg"] as ImageFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  format === f
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* QR preview — always render canvas (hidden when svg mode) for download */}
        <div className="flex justify-center mb-6">
          {isValid ? (
            <div className="p-3 border border-gray-200 rounded-xl shadow-sm">
              {/* Canvas (used for PNG/JPG download) */}
              <div ref={canvasRef} className={format === "svg" ? "hidden" : ""}>
                <QRCodeCanvas
                  value={qrValue}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="H"
                  includeMargin
                />
              </div>
              {/* SVG (visible + used for SVG download) */}
              <div ref={svgRef} className={format !== "svg" ? "hidden" : ""}>
                <QRCodeSVG
                  value={qrValue}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="H"
                  includeMargin
                />
              </div>
            </div>
          ) : (
            <div
              style={{ width: size, height: size }}
              className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm text-center px-4"
            >
              Enter a {type === "url" ? "URL" : "phone number"} to preview
            </div>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={download}
          disabled={!isValid}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Download as {format.toUpperCase()}
        </button>
      </div>
    </main>
  );
}
