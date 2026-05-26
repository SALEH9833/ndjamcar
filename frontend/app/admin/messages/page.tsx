'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Mail, Trash2, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { ContactMessage } from '@/lib/types';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchMessages = useCallback(() => {
    setLoading(true);
    api.get('/api/contact').then(r => setMessages(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const toggleRead = async (msg: ContactMessage) => {
    try {
      await api.put(`/api/contact/${msg.id}/read`);
      fetchMessages();
    } catch { toast.error('Erreur'); }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm('Supprimer ce message ?')) return;
    try { await api.delete(`/api/contact/${id}`); toast.success('Supprimé'); fetchMessages(); }
    catch { toast.error('Erreur'); }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-gray-500 text-sm">{messages.length} message(s) · {unreadCount} non lu(s)</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className={`border-0 shadow-sm ${!msg.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm">{msg.name}</p>
                      {!msg.isRead && <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px]">Nouveau</Badge>}
                      <span className="text-[10px] text-gray-400 ml-auto">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{msg.subject}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{msg.phone}</span>
                      {msg.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{msg.email}</span>}
                    </div>

                    {expanded === msg.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 whitespace-pre-line">{msg.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setExpanded(expanded === msg.id ? null : msg.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      {expanded === msg.id ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                    </button>
                    <button onClick={() => toggleRead(msg)} className="p-1.5 rounded-lg hover:bg-gray-100" title={msg.isRead ? 'Marquer non lu' : 'Marquer lu'}>
                      <MessageSquare className={`h-4 w-4 ${msg.isRead ? 'text-gray-400' : 'text-blue-500'}`} />
                    </button>
                    <a href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${msg.name}, suite à votre message...`)}`} target="_blank" rel="noopener noreferrer">
                      <button className="p-1.5 rounded-lg hover:bg-green-50">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </button>
                    </a>
                    <button onClick={() => deleteMessage(msg.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun message</p>
        </div>
      )}
    </div>
  );
}
