'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSiteContent } from '@/lib/useSiteContent';

export default function ContactPage() {
  const { get } = useSiteContent();
  const WHATSAPP = get('whatsapp', '23560935774');
  const PHONE = get('phone', '+235 60 93 57 74');
  const EMAIL = get('email', 'contact@ndjamcar.com');
  const ADDRESS = get('address', "N'Djaména, Tchad");

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !subject || !message) { toast.error('Remplissez les champs obligatoires'); return; }
    setLoading(true);
    try {
      await api.post('/api/contact', { name, phone, email: email || null, subject, message });
      setSent(true);
      toast.success('Message envoyé !');
    } catch { toast.error('Erreur, réessayez.'); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Message envoyé !</h1>
        <p className="text-gray-500 mb-6">Nous vous répondrons dans les plus brefs délais.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setSent(false); setName(''); setPhone(''); setEmail(''); setSubject(''); setMessage(''); }}>
            Nouveau message
          </Button>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
            <Button className="bg-green-600 hover:bg-green-700 gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Contact</h1>
          <p className="text-muted-foreground">Une question ? Contactez-nous</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            {[
              { icon: Phone, label: 'Téléphone', value: PHONE, href: `tel:${PHONE.replace(/\s/g, '')}` },
              { icon: Mail, label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
              { icon: MapPin, label: 'Adresse', value: ADDRESS, href: undefined },
            ].map((item) => (
              <Card key={item.label} className="border-0 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">{item.value}</a>
                    ) : (
                      <p className="font-medium text-gray-900">{item.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="border-0 shadow-sm bg-green-50 hover:bg-green-100 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600">Réponse rapide</p>
                    <p className="font-medium text-green-800">WhatsApp</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>

          <Card className="border-0 shadow-lg lg:col-span-2">
            <CardContent className="p-8">
              <h2 className="font-bold text-xl mb-6">Envoyez-nous un message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Nom *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className="h-11 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Téléphone *</Label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+235 XX XX XX XX" className="h-11 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="h-11 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Sujet *</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Demande de location" className="h-11 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Message *</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Votre message..." rows={5} className="rounded-lg" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-base gap-2">
                  <Send className="h-4 w-4" /> {loading ? 'Envoi...' : 'Envoyer le message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
