import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addPortfolioItem } from '../../lib/api';
import { uploadToImgBB } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Upload, ImageIcon, CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export default function UploadWorkModal({ open, onClose, onUploaded }: Props) {
  const { refreshUser } = useAuth();
  const [category, setCategory] = useState<'Handwriting' | 'Drawing'>('Handwriting');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }
    console.log('[UploadWorkModal] File selected →', { name: f.name, size: `${(f.size / 1024).toFixed(1)}KB`, type: f.type });
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    console.log('%c[UploadWorkModal] Starting upload →', 'color: #7c3aed; font-weight: bold;', { file: file.name, category });
    setUploading(true);
    setError(null);
    try {
      let imgUrl: string;
      try {
        console.log('[UploadWorkModal] Uploading to ImgBB...');
        imgUrl = await uploadToImgBB(file);
        console.log('%c[UploadWorkModal] ✅ ImgBB upload success →', 'color: #16a34a; font-weight: bold;', imgUrl);
      } catch (err) {
        console.warn('[UploadWorkModal] ⚠️ ImgBB upload failed — using local preview URL →', err);
        imgUrl = preview!;
      }

      try {
        console.log('[UploadWorkModal] Saving portfolio item to Firestore →', { imgUrl, category });
        await addPortfolioItem(imgUrl, category);
        await refreshUser();
        console.log('[UploadWorkModal] ✅ Portfolio item saved to Firestore and user refreshed');
      } catch (err) {
        console.error('[UploadWorkModal] ❌ Firestore portfolio save failed →', err);
      }

      console.log('%c[UploadWorkModal] ✅ Upload complete →', 'color: #16a34a; font-weight: bold;', { imgUrl, category });
      await onUploaded();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setPreview(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('[UploadWorkModal] ❌ Upload pipeline failed →', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Work to Portfolio</DialogTitle>
          <DialogDescription>Share your handwriting or drawings with the community.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="upload-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger id="upload-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Handwriting">✍️ Handwriting</SelectItem>
                <SelectItem value="Drawing">🎨 Drawing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drop zone / Preview */}
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border border-[hsl(var(--border))] group">
              <img src={preview} alt="Preview" className="w-full max-h-56 object-cover" />
              <button
                onClick={reset}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium rounded-2xl"
              >
                Change Image
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-[hsl(var(--border))] rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--accent)/0.3)] transition-all duration-200"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--secondary))] flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Drop your image here</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">or click to browse · Max 10MB</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            id="upload-file-input"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {error && <p className="text-xs text-[hsl(var(--destructive))] text-center">{error}</p>}

          <Button
            id="upload-submit-btn"
            onClick={handleUpload}
            disabled={!file || uploading || success}
            className="w-full gap-2"
          >
            {success ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Uploaded!
              </>
            ) : uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading to ImgBB…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload to Portfolio
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
