import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DocumentUploadProps {
  label: string;
  userId: string;
  clientId?: string;
  documentType: 'aadhar' | 'pan';
  existingUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function DocumentUpload({
  label,
  userId,
  clientId,
  documentType,
  existingUrl,
  onUpload,
  onRemove,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG, WebP) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${clientId || 'new'}_${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get signed URL for private bucket
      const { data: signedData } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedData?.signedUrl) {
        setPreviewUrl(signedData.signedUrl);
        onUpload(fileName); // Store the path, not the signed URL
        toast.success(`${label} uploaded successfully`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (existingUrl) {
      try {
        await supabase.storage.from('client-documents').remove([existingUrl]);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    setPreviewUrl(null);
    onRemove();
  };

  const handleDownload = async () => {
    if (!existingUrl) return;

    try {
      const { data } = await supabase.storage
        .from('client-documents')
        .download(existingUrl);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentType}_document.${existingUrl.split('.').pop()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      toast.error('Failed to download document');
    }
  };

  const handlePreview = async () => {
    if (!existingUrl) return;

    try {
      const { data } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(existingUrl, 60 * 5); // 5 min expiry for preview

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setPreviewOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load preview');
    }
  };

  const isImage = existingUrl?.match(/\.(jpg|jpeg|png|webp)$/i);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {existingUrl ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-3">
          <div className="flex-1 truncate text-sm text-muted-foreground">
            {documentType.toUpperCase()} uploaded
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePreview}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 p-4 transition-colors hover:border-primary/50 hover:bg-secondary/50">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <span className="text-sm text-muted-foreground">Uploading...</span>
          ) : (
            <>
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload {label}
              </span>
            </>
          )}
        </label>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label} Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {previewUrl && isImage ? (
              <img
                src={previewUrl}
                alt={label}
                className="max-h-[60vh] max-w-full rounded-lg object-contain"
              />
            ) : previewUrl ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-muted-foreground">PDF document uploaded</p>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download to view
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
