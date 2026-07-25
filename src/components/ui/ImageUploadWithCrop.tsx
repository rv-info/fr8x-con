// FR8X-CON Image Upload with Canvas-based Crop & Resize Component
// Clean, dependency-free React 19 component using Lucide icons and Tailwind.

"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, ZoomIn, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadFile } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/Button";

interface ImageUploadWithCropProps {
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  currentImageUrl?: string | null;
  storagePath: string;
  aspectRatio?: "square" | "banner";
  maxSizeMB?: number;
  label?: string;
}

export function ImageUploadWithCrop({
  onUploadComplete,
  onRemove,
  currentImageUrl,
  storagePath,
  aspectRatio = "square",
  maxSizeMB = 2,
  label = "Upload Image",
}: ImageUploadWithCropProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean source on unmount
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit of ${maxSizeMB}MB.`);
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG, and WEBP are supported.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit of ${maxSizeMB}MB.`);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG, and WEBP are supported.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleUpload = async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    setIsUploading(true);
    setError(null);

    try {
      // Draw cropped image onto canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2D context");

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Save canvas state
      ctx.save();

      // Translate to center to apply zoom and offsets
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(offsetX, offsetY);

      // Draw image centered
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      // Calculate fit scale
      const scale = Math.max(width / imgWidth, height / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Convert canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b),
          "image/jpeg",
          0.85
        );
      });

      if (!blob) throw new Error("Canvas export failed");

      // Upload to Firebase Storage
      const downloadUrl = await uploadFile(storagePath, blob, {
        contentType: "image/jpeg",
      });

      onUploadComplete(downloadUrl);
      setSuccess(true);
      setImageSrc(null);
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to crop or upload image. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setImageSrc(null);
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-3">
      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
      />

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 text-[10px] rounded flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2 text-[10px] rounded flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>Image uploaded successfully!</span>
        </div>
      )}

      {/* Dropzone & Edit Box */}
      {!imageSrc ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--fr8x-lavender)] hover:border-[var(--fr8x-periwinkle)] bg-slate-50 hover:bg-slate-100/50 rounded-lg p-4 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[110px]"
        >
          {currentImageUrl ? (
            <div className="relative group mb-1">
              <img
                src={currentImageUrl}
                alt="Current thumbnail"
                className={`object-cover border border-slate-200 shadow-sm ${
                  aspectRatio === "square"
                    ? "w-12 h-12 rounded-full"
                    : "w-28 h-10 rounded"
                }`}
              />
              <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="h-3 w-3 text-white" />
              </div>
            </div>
          ) : (
            <Upload className="h-5 w-5 text-foreground-muted mb-1.5" />
          )}
          <p className="text-[10px] font-semibold text-[var(--fr8x-jet)]">
            {currentImageUrl ? "Click or drag to replace" : label}
          </p>
          <p className="text-[9px] text-foreground-muted mt-0.5">
            JPG, PNG, WEBP (Max {maxSizeMB}MB)
          </p>
          {currentImageUrl && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="mt-2 text-[9px] text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 mx-auto font-medium"
            >
              <Trash2 className="h-2.5 w-2.5" /> Remove current photo
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg p-3 space-y-3">
          {/* Crop Container */}
          <div className="relative bg-slate-900 rounded overflow-hidden flex items-center justify-center h-44 border border-slate-700">
            {/* Aspect Ratio Box Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center bg-black/55">
              <div
                className={`border-2 border-white/95 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ${
                  aspectRatio === "square"
                    ? "w-28 h-28 rounded-full"
                    : "w-36 h-12 rounded"
                }`}
              />
            </div>

            {/* The Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="max-h-full max-w-full object-contain pointer-events-none select-none"
              style={{
                transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
                transition: isUploading ? "none" : "transform 0.05s ease-out",
              }}
            />

            {/* Hidden canvas for drawing crop */}
            <canvas
              ref={canvasRef}
              width={aspectRatio === "square" ? 256 : 600}
              height={aspectRatio === "square" ? 256 : 200}
              className="hidden"
            />
          </div>

          {/* Sliders and Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ZoomIn className="h-3 w-3 text-foreground-muted shrink-0" />
              <span className="text-[9px] text-foreground-secondary w-8">Zoom:</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-foreground-muted w-7 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-foreground-secondary w-8">Pan X:</span>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-foreground-secondary w-8">Pan Y:</span>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] hover:underline"
            >
              Cancel
            </button>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-[10px] bg-slate-100 border border-slate-200 text-[var(--fr8x-jet)] px-2.5 py-1 rounded hover:bg-slate-200 transition-colors"
              >
                Change File
              </button>
              <Button
                type="button"
                onClick={handleUpload}
                isLoading={isUploading}
                loadingText="Uploading..."
                className="fr8x-btn-primary text-[10px] py-1 px-3"
              >
                Crop & Upload
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
