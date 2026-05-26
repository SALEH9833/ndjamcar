'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ContentItem {
  id: number;
  key: string;
  value: string;
  label: string;
  type: string;
}

export default function AdminContenuPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/api/content/all').then(r => {
      const data = r.data.data || [];
      setContents(data);
      const v: Record<string, string> = {};
      data.forEach((c: ContentItem) => { v[c.key] = c.value; });
      setValues(v);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = Object.entries(values).map(([key, value]) => ({ key, value }));
      await api.put('/api/content', { items });
      toast.success('Contenu sauvegardé');
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contenu du site</h1>
          <p className="text-gray-500 text-sm">Modifiez les textes affichés sur le site</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
          <Save className="h-4 w-4" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      {contents.length > 0 ? (
        <div className="space-y-4">
          {contents.map((c) => (
            <Card key={c.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <Label className="text-xs font-medium text-gray-500 mb-1.5 block">{c.label} <span className="text-gray-300">({c.key})</span></Label>
                {c.type === 'textarea' ? (
                  <Textarea
                    value={values[c.key] || ''}
                    onChange={(e) => setValues({ ...values, [c.key]: e.target.value })}
                    rows={3}
                    className="rounded-lg"
                  />
                ) : (
                  <Input
                    value={values[c.key] || ''}
                    onChange={(e) => setValues({ ...values, [c.key]: e.target.value })}
                    className="h-10 rounded-lg"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun contenu configuré</p>
        </div>
      )}
    </div>
  );
}
