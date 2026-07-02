import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface Diagnosis {
  id: string;
  image_url: string;
  description: string;
  ai_response: string | null;
  language: string;
  status: 'pending' | 'complete' | 'failed';
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDiagnoses();
  }, []);

  const fetchDiagnoses = async () => {
    try {
      const res = await api.get('/diagnosis');
      setDiagnoses(res.data.data.diagnoses);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Basic polling for pending jobs
  useEffect(() => {
    const hasPending = diagnoses.some(d => d.status === 'pending');
    let interval: number;
    
    if (hasPending) {
      interval = window.setInterval(fetchDiagnoses, 5000);
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [diagnoses]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome, {user?.name || user?.email?.split('@')[0]}</h1>
          <p className="text-gray-600">Here is your diagnosis history.</p>
        </div>
        <Link to="/diagnose" className="btn-primary">New Diagnosis</Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 mb-6 text-sm">{error}</div>}

      {diagnoses.length === 0 ? (
        <div className="border border-border bg-gray-50 p-12 text-center">
          <p className="text-gray-500 mb-4">You haven't submitted any circuits yet.</p>
          <Link to="/diagnose" className="text-primary font-medium hover:underline">Get started with your first triage</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {diagnoses.map((d) => (
            <div key={d.id} className="card flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4">
                <div className="aspect-square bg-gray-100 border border-border flex items-center justify-center overflow-hidden">
                  <img src={d.image_url} alt="Circuit" className="object-cover w-full h-full" />
                </div>
                <div className="mt-3">
                  <span className={`text-xs font-bold px-2 py-1 uppercase tracking-wider ${
                    d.status === 'complete' ? 'bg-green-100 text-green-800' :
                    d.status === 'pending' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {d.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">{new Date(d.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="w-full md:w-3/4 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Symptom Description</h3>
                  <p className="text-text text-sm bg-gray-50 p-3 border border-border">{d.description}</p>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">AI Triage Report</h3>
                  {d.status === 'pending' ? (
                    <div className="text-sm text-gray-500 italic p-3 border border-dashed border-border h-full flex items-center justify-center">
                      Analyzing circuit diagram...
                    </div>
                  ) : d.status === 'failed' ? (
                    <div className="text-sm text-red-500 p-3 border border-red-200 bg-red-50">
                      Analysis failed. Please try again or check the image quality.
                    </div>
                  ) : (
                    <div className="text-text text-sm p-4 border border-border bg-white prose prose-sm max-w-none whitespace-pre-wrap">
                      {d.ai_response}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
