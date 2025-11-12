import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function usePdfUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(0);
      const response = await apiClient.uploadPdf(file);
      setUploadProgress(100);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate and refetch PDFs list
      queryClient.invalidateQueries({ queryKey: ['pdfs'] });
      setTimeout(() => setUploadProgress(0), 2000);
      
      // Show success message
      if (data.success) {
        alert(`PDF "${(data.data as any)?.filename || 'file'}" uploaded successfully!`);
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    },
    onError: (error: any) => {
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
      setUploadProgress(0);
    },
  });

  const { data: pdfs, refetch, isLoading } = useQuery({
    queryKey: ['pdfs'],
    queryFn: async () => {
      const response = await apiClient.listPdfs();
      return response;
    },
  });

  return {
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    uploadProgress,
    pdfs: pdfs?.data || [],
    isLoadingPdfs: isLoading,
    refetchPdfs: refetch,
  };
}

