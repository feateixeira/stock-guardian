import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Printer } from 'lucide-react';

export default function OSDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [os, setOs] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [onus, setOnus] = useState<any[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [showDevolucao, setShowDevolucao] = useState(false);
  const [devItens, setDevItens] = useState<Record<string, number>>({});
  const [devOnus, setDevOnus] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchOS(); }, [id]);

  const fetchOS = async () => {
    const { data: osData } = await supabase.from('ordens_servico').select('*, funcionario:funcionarios(nome)').eq('id', id).single();
    setOs(osData);
    const { data: itensData } = await supabase.from('os_itens').select('*, item:itens(nome, unidade)').eq('os_id', id);
    setItens(itensData || []);
    const { data: onusData } = await supabase.from('os_onus').select('*, onu:onus(codigo_unico)').eq('os_id', id);
    setOnus(onusData || []);
  };

  const handleConfirmar = async (assinatura: string) => {
    for (const i of itens) {
      const { data: item } = await supabase.from('itens').select('qtd_atual').eq('id', i.item_id).single();
      if (!item || item.qtd_atual < i.quantidade) {
        toast({ title: `Estoque insuficiente: ${i.item?.nome}`, variant: 'destructive' });
        return;
      }
    }
    for (const i of itens) {
      await supabase.from('itens').update({ qtd_atual: supabase.rpc }).eq('id', i.item_id);
      await supabase.rpc('', {});
    }
    for (const i of itens) {
      const { data: item } = await supabase.from('itens').select('qtd_atual').eq('id', i.item_id).single();
      await supabase.from('itens').update({ qtd_atual: (item?.qtd_atual || 0) - i.quantidade }).eq('id', i.item_id);
      await supabase.from('movimentacoes').insert({ tipo: 'saida', item_id: i.item_id, quantidade: i.quantidade, os_id: id, funcionario_id: os.funcionario_id, usuario_id: usuario?.id, descricao: `Saída OS #${os.numero}` });
    }
    for (const o of onus) {
      await supabase.from('onus').update({ status: 'em_uso', funcionario_atual_id: os.funcionario_id, os_vinculada_id: id }).eq('id', o.onu_id);
      await supabase.from('onu_historico').insert({ onu_id: o.onu_id, status_anterior: 'em_estoque', status_novo: 'em_uso', funcionario_id: os.funcionario_id, os_id: id, usuario_id: usuario?.id, descricao: `Atribuída OS #${os.numero}` });
      await supabase.from('movimentacoes').insert({ tipo: 'saida', onu_id: o.onu_id, os_id: id, funcionario_id: os.funcionario_id, usuario_id: usuario?.id, descricao: `Saída ONU OS #${os.numero}` });
    }
    await supabase.from('ordens_servico').update({ status: 'confirmada', assinatura_base64: assinatura, assinatura_data: new Date().toISOString(), assinatura_usuario_id: usuario?.id }).eq('id', id);
    toast({ title: 'OS confirmada' });
    setShowSignature(false);
    fetchOS();
  };

  const handleCancelar = async () => {
    if (os.status === 'confirmada') {
      for (const i of itens) {
        const { data: item } = await supabase.from('itens').select('qtd_atual').eq('id', i.item_id).single();
        await supabase.from('itens').update({ qtd_atual: (item?.qtd_atual || 0) + i.quantidade }).eq('id', i.item_id);
        await supabase.from('movimentacoes').insert({ tipo: 'cancelamento', item_id: i.item_id, quantidade: i.quantidade, os_id: id, usuario_id: usuario?.id, descricao: `Cancelamento OS #${os.numero}` });
      }
      for (const o of onus) {
        await supabase.from('onus').update({ status: 'em_estoque', funcionario_atual_id: null, os_vinculada_id: null }).eq('id', o.onu_id);
        await supabase.from('onu_historico').insert({ onu_id: o.onu_id, status_anterior: 'em_uso', status_novo: 'em_estoque', os_id: id, usuario_id: usuario?.id, descricao: `Cancelamento OS #${os.numero}` });
        await supabase.from('movimentacoes').insert({ tipo: 'cancelamento', onu_id: o.onu_id, os_id: id, usuario_id: usuario?.id, descricao: `Cancelamento ONU OS #${os.numero}` });
      }
    }
    await supabase.from('ordens_servico').update({ status: 'cancelada' }).eq('id', id);
    toast({ title: 'OS cancelada' });
    fetchOS();
  };

  const handleDevolucao = async () => {
    const { data: dev } = await supabase.from('devolucoes').insert({ os_id: id, usuario_id: usuario?.id }).select().single();
    for (const [itemId, qtd] of Object.entries(devItens)) {
      if (qtd > 0) {
        await supabase.from('devolucao_itens').insert({ devolucao_id: dev?.id, item_id: itemId, quantidade: qtd });
        const { data: item } = await supabase.from('itens').select('qtd_atual').eq('id', itemId).single();
        await supabase.from('itens').update({ qtd_atual: (item?.qtd_atual || 0) + qtd }).eq('id', itemId);
        await supabase.from('movimentacoes').insert({ tipo: 'devolucao', item_id: itemId, quantidade: qtd, os_id: id, usuario_id: usuario?.id, descricao: `Devolução OS #${os.numero}` });
      }
    }
    for (const [onuId, checked] of Object.entries(devOnus)) {
      if (checked) {
        await supabase.from('devolucao_onus').insert({ devolucao_id: dev?.id, onu_id: onuId });
        await supabase.from('onus').update({ status: 'em_estoque', funcionario_atual_id: null, os_vinculada_id: null }).eq('id', onuId);
        await supabase.from('onu_historico').insert({ onu_id: onuId, status_anterior: 'em_uso', status_novo: 'em_estoque', os_id: id, usuario_id: usuario?.id, descricao: `Devolução OS #${os.numero}` });
        await supabase.from('movimentacoes').insert({ tipo: 'devolucao', onu_id: onuId, os_id: id, usuario_id: usuario?.id, descricao: `Devolução ONU OS #${os.numero}` });
      }
    }
    await supabase.from('ordens_servico').update({ status: 'devolucao_parcial' }).eq('id', id);
    toast({ title: 'Devolução registrada' });
    setShowDevolucao(false);
    fetchOS();
  };

  if (!os) return <Layout><p>Carregando...</p></Layout>;

  return (
    <Layout>
      <div className="space-y-4 print-area">
        <div className="flex justify-between items-center no-print">
          <h1 className="text-2xl font-bold">OS #{os.numero}</h1>
          <Button variant="outline" onClick={() => window.print()}><Printer size={16} className="mr-2" />Imprimir</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div><strong>Funcionário:</strong> {os.funcionario?.nome}</div>
            <div><strong>Status:</strong> <Badge>{os.status}</Badge></div>
            <div><strong>Data:</strong> {new Date(os.created_at).toLocaleString('pt-BR')}</div>
            <div><strong>Observações:</strong> {os.observacoes || '-'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Itens ({itens.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qtd</TableHead><TableHead>Un</TableHead></TableRow></TableHeader>
              <TableBody>{itens.map(i => <TableRow key={i.id}><TableCell>{i.item?.nome}</TableCell><TableCell>{i.quantidade}</TableCell><TableCell>{i.item?.unidade}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ONUs ({onus.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead></TableRow></TableHeader>
              <TableBody>{onus.map(o => <TableRow key={o.id}><TableCell className="font-mono">{o.onu?.codigo_unico}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>

        {os.assinatura_base64 && (
          <Card>
            <CardHeader><CardTitle>Assinatura</CardTitle></CardHeader>
            <CardContent>
              <img src={os.assinatura_base64} alt="Assinatura" className="border max-w-md" />
              <p className="text-sm text-muted-foreground mt-2">Coletada em: {new Date(os.assinatura_data).toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 no-print">
          {os.status === 'rascunho' && <Button onClick={() => setShowSignature(true)}>Confirmar OS</Button>}
          {(os.status === 'rascunho' || os.status === 'confirmada') && <Button variant="destructive" onClick={handleCancelar}>Cancelar OS</Button>}
          {os.status === 'confirmada' && <Button variant="outline" onClick={() => setShowDevolucao(true)}>Registrar Devolução</Button>}
        </div>
      </div>

      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Coletar Assinatura</DialogTitle></DialogHeader>
          <SignatureCanvas onSave={handleConfirmar} onCancel={() => setShowSignature(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showDevolucao} onOpenChange={setShowDevolucao}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Devolução</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><strong>Itens:</strong></div>
            {itens.map(i => (
              <div key={i.id} className="flex items-center gap-2">
                <span className="flex-1">{i.item?.nome}</span>
                <Input type="number" min="0" max={i.quantidade} className="w-20" value={devItens[i.item_id] || 0} onChange={e => setDevItens({ ...devItens, [i.item_id]: parseInt(e.target.value) || 0 })} />
                <span>/ {i.quantidade}</span>
              </div>
            ))}
            <div><strong>ONUs:</strong></div>
            {onus.map(o => (
              <div key={o.id} className="flex items-center gap-2">
                <Checkbox checked={devOnus[o.onu_id] || false} onCheckedChange={(c) => setDevOnus({ ...devOnus, [o.onu_id]: !!c })} />
                <span className="font-mono">{o.onu?.codigo_unico}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDevolucao(false)}>Cancelar</Button>
            <Button onClick={handleDevolucao}>Confirmar Devolução</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}