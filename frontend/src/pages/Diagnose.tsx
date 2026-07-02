import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/axios';

const diagnoseSchema = z.object({
  description: z.string().min(10, 'Please provide more details about the issue (at least 10 characters)'),
  language: z.enum(['en', 'hi']).default('en'),
});

type DiagnoseForm = z.infer<typeof diagnoseSchema>;

export default function Diagnose() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<DiagnoseForm>({
    resolver: zodResolver(diagnoseSchema) as any
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.type.startsWith('image/')) {
        setFileError('Please select a valid image file.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError('Image must be less than 10MB.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const onSubmit = async (data: DiagnoseForm) => {
    if (!file) {
      setFileError('Please upload a circuit diagram image.');
      return;
    }

    try {
      setUploading(true);
      setSubmitError('');

      // 1. Upload image to get S3 URL
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = uploadRes.data.data.imageUrl;

      // 2. Submit diagnosis request
      await api.post('/diagnosis', {
        imageUrl,
        description: data.description,
        language: data.language
      });

      // Navigate to dashboard where they can see it pending/complete
      navigate(`/dashboard`);
    } catch (error: any) {
      console.error(error);
      setSubmitError(error.response?.data?.message || 'An error occurred during submission.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New Diagnosis</h1>
        <p className="text-gray-600">Upload your circuit diagram and describe the symptoms.</p>
      </div>

      <div className="card">
        {submitError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 mb-6 text-sm">{submitError}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-bold mb-2">Circuit Diagram Image (Max 10MB)</label>
            <div 
              className={`border-2 border-dashed ${fileError ? 'border-red-500' : 'border-border'} p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              {file ? (
                <div>
                  <p className="font-medium text-text">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-primary text-sm mt-2 hover:underline">Change File</button>
                </div>
              ) : (
                <div>
                  <p className="text-text font-medium">Click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP</p>
                </div>
              )}
            </div>
            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
          </div>

          {/* Description Section */}
          <div>
            <label className="block text-sm font-bold mb-2">Symptoms & Description</label>
            <textarea 
              {...register('description')} 
              className="input-field min-h-[120px]" 
              placeholder="E.g., The cylinder is extending too slowly and there is a whining noise from the pump..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Language Section */}
          <div>
            <label className="block text-sm font-bold mb-2">Response Language</label>
            <select {...register('language')} className="input-field bg-white">
              <option value="en">English</option>
              <option value="hi">Hindi (हिन्दी)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-border">
            <button type="submit" disabled={uploading} className="btn-primary w-full py-3">
              {uploading ? 'Processing...' : 'Submit for Triage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
