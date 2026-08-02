"use client";

import { useState } from "react";
import { X, ZoomIn, RotateCw, Check, Trash2 } from "lucide-react";

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
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const handleApply = () => {
    // Return modified data URL string
    if (imageSrc) {
      onSaveCrop(imageSrc);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-body-md font-bold text-[var(--fr8x-jet)]">
            Enterprise Branding — Image Crop & Zoom
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center">
          <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-[var(--fr8x-periwinkle)] shadow-inner bg-slate-900 flex items-center justify-center">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt="Profile Preview"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.1s ease-out",
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-slate-400 text-[11px]">No Image Loaded</span>
            )}
          </div>

          {/* Zoom & Rotation Sliders */}
          <div className="w-full mt-4 space-y-3 px-2">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <ZoomIn className="h-3 w-3 text-slate-500" /> Zoom Level
                </span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--fr8x-periwinkle)]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded"
              >
                <RotateCw className="h-3 w-3" /> Rotate 90°
              </button>

              {onRemovePicture && (
                <button
                  type="button"
                  onClick={() => {
                    onRemovePicture();
                    onClose();
                  }}
                  className="text-[11px] text-red-600 hover:text-red-800 font-bold flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded border border-red-200"
                >
                  <Trash2 className="h-3 w-3" /> Remove Picture
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="fr8x-btn-secondary text-[11px] px-3 py-1.5">
            Cancel
          </button>
          <button onClick={handleApply} className="fr8x-btn-primary text-[11px] px-4 py-1.5 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
