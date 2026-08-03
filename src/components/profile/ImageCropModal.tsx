"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, ZoomIn, RotateCw, Check, Trash2, Move, RefreshCw } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSaveCrop: (croppedDataUrl: string) => void;
  onRemovePicture?: () => void;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onSaveCrop,
  onRemovePicture,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPanX(0);
      setPanY(0);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen) return null;

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
  };

  const handleApplyCrop = () => {
    if (!imageSrc) {
      onClose();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      onSaveCrop(imageSrc);
      onClose();
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        onSaveCrop(imageSrc);
        onClose();
        return;
      }

      const outputSize = 400; // High resolution square export
      canvas.width = outputSize;
      canvas.height = outputSize;

      ctx.clearRect(0, 0, outputSize, outputSize);
      ctx.save();

      // Translate to canvas center
      ctx.translate(outputSize / 2, outputSize / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply zoom & pan offsets
      ctx.scale(zoom, zoom);
      ctx.translate(panX * (img.width / 200), panY * (img.height / 200));

      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
      ctx.restore();

      try {
        const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        onSaveCrop(croppedDataUrl);
      } catch (err) {
        console.warn("Canvas export fallback:", err);
        onSaveCrop(imageSrc);
      }
      onClose();
    };

    img.onerror = () => {
      onSaveCrop(imageSrc);
      onClose();
    };

    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-left">
      {/* Hidden canvas for drawing crop */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ZoomIn className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
            Profile Picture Crop &amp; Adjust
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Circular Preview Container (Light Background) */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-[var(--fr8x-periwinkle)] shadow-md bg-slate-100 flex items-center justify-center group">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Profile Preview"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${panX}px, ${panY}px)`,
                  transition: "transform 0.05s ease-out",
                }}
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <span className="text-slate-400 text-xs font-semibold">No Image Loaded</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <Move className="h-3.5 w-3.5 text-slate-400" /> Use sliders below to scale, rotate and position
          </p>
        </div>

        {/* Sliders and Controls */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {/* Zoom Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="h-4 w-4 text-slate-500" /> Zoom Level
              </span>
              <span className="font-bold text-[var(--fr8x-periwinkle)]">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--fr8x-periwinkle)]"
            />
          </div>

          {/* Pan X and Pan Y Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                <span>Pan Horizontal</span>
                <span>{panX}px</span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                value={panX}
                onChange={(e) => setPanX(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--fr8x-periwinkle)]"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                <span>Pan Vertical</span>
                <span>{panY}px</span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                value={panY}
                onChange={(e) => setPanY(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--fr8x-periwinkle)]"
              />
            </div>
          </div>

          {/* Rotate & Reset Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5 text-slate-500" /> Rotate 90°
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Reset
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div>
            {onRemovePicture && (
              <button
                type="button"
                onClick={() => {
                  onRemovePicture();
                  onClose();
                }}
                className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition-colors"
              >
                <Trash2 className="h-4 w-4 text-rose-600" /> Remove Image
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="fr8x-btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="fr8x-btn-primary text-xs px-5 py-2 flex items-center gap-1.5 font-bold shadow-sm"
            >
              <Check className="h-4 w-4" /> Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
