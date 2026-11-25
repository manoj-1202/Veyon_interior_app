-- Add columns for Aadhar and PAN card images
ALTER TABLE public.clients
ADD COLUMN aadhar_image_url text,
ADD COLUMN pan_image_url text;

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for client-documents bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload their own client documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own client documents
CREATE POLICY "Users can view their own client documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'client-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own client documents
CREATE POLICY "Users can update their own client documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'client-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own client documents
CREATE POLICY "Users can delete their own client documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'client-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);