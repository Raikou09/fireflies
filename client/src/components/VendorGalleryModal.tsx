import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, X, Plus, Loader2, Images, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CourtWithDetails } from "@shared/schema";

interface VendorGalleryModalProps {
  court: CourtWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorGalleryModal({ court, isOpen, onClose }: VendorGalleryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (court && isOpen) {
      const imgs =
        court.images && court.images.length > 0
          ? court.images
          : court.imageUrl
          ? [court.imageUrl]
          : [];
      setGalleryImages(imgs);
      setCoverImageUrl(court.imageUrl || imgs[0] || "");
    }
  }, [court?.id, isOpen]);

  const saveGalleryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/vendor/courts/${court?.id}/gallery`, "PUT", {
        images: galleryImages,
        imageUrl: coverImageUrl || galleryImages[0] || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/courts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courts", court?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      onClose();
      toast({ title: "Gallery Saved", description: "Court photos updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save gallery. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadImageFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const response = await fetch("/api/objects/upload-file", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (galleryImages.length + files.length > 8) {
      toast({ title: "Too many images", description: "You can upload up to 8 images.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB.`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const urls = await Promise.all(validFiles.map(uploadImageFile));
      setGalleryImages((prev) => {
        const updated = [...prev, ...urls].slice(0, 8);
        if (!coverImageUrl && updated.length > 0) setCoverImageUrl(updated[0]);
        return updated;
      });
      toast({ title: "Images Uploaded", description: `${urls.length} image(s) added.` });
    } catch {
      toast({ title: "Upload Failed", description: "Some images failed to upload.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setGalleryImages((prev) => {
      const removed = prev[idx];
      const updated = prev.filter((_, i) => i !== idx);
      if (coverImageUrl === removed) {
        setCoverImageUrl(updated[0] || "");
      }
      return updated;
    });
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= galleryImages.length) return;
    setGalleryImages((prev) => {
      const updated = [...prev];
      [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
      return updated;
    });
  };

  if (!court) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="h-5 w-5" />
            Manage Photos — {court.name}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload and manage your court gallery. Changes are saved immediately without requiring admin re-approval.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryImages.map((url, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border-2 border-transparent">
                  <img
                    src={url}
                    alt={`Court image ${idx + 1}`}
                    className={`w-full h-28 object-cover border-2 rounded-lg ${
                      url === coverImageUrl ? "border-primary" : "border-transparent"
                    }`}
                  />
                  {url === coverImageUrl && (
                    <span className="absolute top-1 left-1 bg-primary text-white text-xs px-1 rounded">
                      Cover
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1 p-1">
                    {url !== coverImageUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl(url)}
                        className="bg-white text-gray-800 text-xs px-2 py-1 rounded hover:bg-gray-100 w-full text-center"
                      >
                        Set as Cover
                      </button>
                    )}
                    <div className="flex gap-1 w-full">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="flex-1 bg-white/80 text-gray-800 p-1 rounded hover:bg-white disabled:opacity-30 flex items-center justify-center"
                        title="Move left"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="flex-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 flex items-center justify-center"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === galleryImages.length - 1}
                        className="flex-1 bg-white/80 text-gray-800 p-1 rounded hover:bg-white disabled:opacity-30 flex items-center justify-center"
                        title="Move right"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Images className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No photos yet. Add some to showcase your court.</p>
            </div>
          )}

          {galleryImages.length < 8 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <CloudUpload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-1 text-sm">Add court photos</p>
              <p className="text-xs text-gray-500 mb-3">
                Max 10MB per image • {galleryImages.length}/8 uploaded
              </p>
              <label className="inline-flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Photos
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-primary hover:bg-green-700"
              onClick={() => saveGalleryMutation.mutate()}
              disabled={saveGalleryMutation.isPending || isUploading}
            >
              {saveGalleryMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Gallery"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
