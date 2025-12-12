import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
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

  const handleConfirmar = async () => {
    // Validar estoque primeiro
    for (const i of itens) {
      const { data: item } = await supabase.from('itens').select('qtd_atual').eq('id', i.item_id).single();
      if (!item || (item.qtd_atual || 0) < i.quantidade) {
        toast({ title: `Estoque insuficiente: ${i.item?.nome}`, variant: 'destructive' });
        return;
      }
    }
    
    // Baixar itens do estoque
    for (const i of itens) {
      const { data: item } = await supabase.from('itens').select('qtd_atual').eq('id', i.item_id).single();
      const novaQtd = (item?.qtd_atual || 0) - i.quantidade;
      await supabase.from('itens').update({ qtd_atual: novaQtd, updated_at: new Date().toISOString() }).eq('id', i.item_id);
      await supabase.from('movimentacoes').insert({ 
        tipo: 'saida' as const, 
        item_id: i.item_id, 
        quantidade: i.quantidade, 
        os_id: id, 
        funcionario_id: os.funcionario_id, 
        usuario_id: usuario?.id, 
        descricao: `Saída OS #${os.numero}` 
      });
    }
    
    // Atribuir ONUs ao funcionário
    for (const o of onus) {
      await supabase.from('onus').update({ 
        status: 'em_uso' as const, 
        funcionario_atual_id: os.funcionario_id, 
        os_vinculada_id: id,
        updated_at: new Date().toISOString()
      }).eq('id', o.onu_id);
      
      await supabase.from('onu_historico').insert({ 
        onu_id: o.onu_id, 
        status_anterior: 'em_estoque' as const, 
        status_novo: 'em_uso' as const, 
        funcionario_id: os.funcionario_id, 
        os_id: id, 
        usuario_id: usuario?.id, 
        descricao: `Atribuída OS #${os.numero}` 
      });
      
      await supabase.from('movimentacoes').insert({ 
        tipo: 'saida' as const, 
        onu_id: o.onu_id, 
        os_id: id, 
        funcionario_id: os.funcionario_id, 
        usuario_id: usuario?.id, 
        descricao: `Saída ONU OS #${os.numero}` 
      });
    }
    
    // Atualizar status da OS
    await supabase.from('ordens_servico').update({ 
      status: 'confirmada' as const,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    
    toast({ title: 'OS confirmada com sucesso!' });
    fetchOS();
  };

  const handleCancelar = async () => {
    if (os.status === 'confirmada') {
      // Estornar itens
      for (const i of itens) {
        const { data: item } = await supabase.from('itens').select('qtd_atual').eq('id', i.item_id).single();
        const novaQtd = (item?.qtd_atual || 0) + i.quantidade;
        await supabase.from('itens').update({ qtd_atual: novaQtd, updated_at: new Date().toISOString() }).eq('id', i.item_id);
        await supabase.from('movimentacoes').insert({ 
          tipo: 'cancelamento' as const, 
          item_id: i.item_id, 
          quantidade: i.quantidade, 
          os_id: id, 
          usuario_id: usuario?.id, 
          descricao: `Cancelamento OS #${os.numero}` 
        });
      }
      // Estornar ONUs
      for (const o of onus) {
        await supabase.from('onus').update({ 
          status: 'em_estoque' as const, 
          funcionario_atual_id: null, 
          os_vinculada_id: null,
          updated_at: new Date().toISOString()
        }).eq('id', o.onu_id);
        
        await supabase.from('onu_historico').insert({ 
          onu_id: o.onu_id, 
          status_anterior: 'em_uso' as const, 
          status_novo: 'em_estoque' as const, 
          os_id: id, 
          usuario_id: usuario?.id, 
          descricao: `Cancelamento OS #${os.numero}` 
        });
        
        await supabase.from('movimentacoes').insert({ 
          tipo: 'cancelamento' as const, 
          onu_id: o.onu_id, 
          os_id: id, 
          usuario_id: usuario?.id, 
          descricao: `Cancelamento ONU OS #${os.numero}` 
        });
      }
    }
    
    await supabase.from('ordens_servico').update({ 
      status: 'cancelada' as const,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    
    toast({ title: 'OS cancelada' });
    fetchOS();
  };

  const handleDevolucao = async () => {
    const { data: dev } = await supabase.from('devolucoes').insert({ os_id: id, usuario_id: usuario?.id }).select().single();
    
    for (const [itemId, qtd] of Object.entries(devItens)) {
      if (qtd > 0) {
        await supabase.from('devolucao_itens').insert({ devolucao_id: dev?.id, item_id: itemId, quantidade: qtd });
        const { data: item } = await supabase.from('itens').select('qtd_atual').eq('id', itemId).single();
        await supabase.from('itens').update({ 
          qtd_atual: (item?.qtd_atual || 0) + qtd,
          updated_at: new Date().toISOString()
        }).eq('id', itemId);
        await supabase.from('movimentacoes').insert({ 
          tipo: 'devolucao' as const, 
          item_id: itemId, 
          quantidade: qtd, 
          os_id: id, 
          usuario_id: usuario?.id, 
          descricao: `Devolução OS #${os.numero}` 
        });
      }
    }
    
    for (const [onuId, checked] of Object.entries(devOnus)) {
      if (checked) {
        await supabase.from('devolucao_onus').insert({ devolucao_id: dev?.id, onu_id: onuId });
        await supabase.from('onus').update({ 
          status: 'em_estoque' as const, 
          funcionario_atual_id: null, 
          os_vinculada_id: null,
          updated_at: new Date().toISOString()
        }).eq('id', onuId);
        await supabase.from('onu_historico').insert({ 
          onu_id: onuId, 
          status_anterior: 'em_uso' as const, 
          status_novo: 'em_estoque' as const, 
          os_id: id, 
          usuario_id: usuario?.id, 
          descricao: `Devolução OS #${os.numero}` 
        });
        await supabase.from('movimentacoes').insert({ 
          tipo: 'devolucao' as const, 
          onu_id: onuId, 
          os_id: id, 
          usuario_id: usuario?.id, 
          descricao: `Devolução ONU OS #${os.numero}` 
        });
      }
    }
    
    await supabase.from('ordens_servico').update({ 
      status: 'devolucao_parcial' as const,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    
    toast({ title: 'Devolução registrada' });
    setShowDevolucao(false);
    fetchOS();
  };

  if (!os) return <Layout><p>Carregando...</p></Layout>;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'rascunho': 'Rascunho',
      'confirmada': 'Confirmada',
      'cancelada': 'Cancelada',
      'devolucao_parcial': 'Devolução Parcial',
      'encerrada': 'Encerrada'
    };
    return labels[status] || status;
  };

  return (
    <Layout>
      <div className="space-y-4 print-area">
        {/* Header visível apenas na impressão */}
        <div className="hidden print:block print-header">
          <h1>ORDEM DE SERVIÇO Nº {os.numero}</h1>
          <p>Sistema de Controle de Estoque - Stock Guardian Pro</p>
        </div>

        {/* Controles - não aparecem na impressão */}
        <div className="flex justify-between items-center no-print">
          <h1 className="text-2xl font-bold">OS #{os.numero}</h1>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={16} className="mr-2" />
            Imprimir
          </Button>
        </div>

        {/* Informações da OS */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Ordem de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Número da OS:</strong> {os.numero}
              </div>
              <div>
                <strong>Status:</strong> <Badge className="no-print">{getStatusLabel(os.status)}</Badge>
                <span className="print:inline print:ml-2 hidden print:block">{getStatusLabel(os.status)}</span>
              </div>
              <div>
                <strong>Funcionário:</strong> {os.funcionario?.nome}
              </div>
              <div>
                <strong>Data de Criação:</strong> {new Date(os.created_at).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              {os.observacoes && (
                <div className="col-span-2">
                  <strong>Observações:</strong>
                  <p className="mt-1">{os.observacoes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Itens */}
        {itens.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Itens Solicitados ({itens.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map(i => (
                    <TableRow key={i.id}>
                      <TableCell>{i.item?.nome}</TableCell>
                      <TableCell className="text-center">{i.quantidade}</TableCell>
                      <TableCell className="text-center">{i.item?.unidade || 'un'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ONUs */}
        {onus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ONUs ({onus.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código da ONU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onus.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono">{o.onu?.codigo_unico}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Área de assinatura manual para impressão */}
        <div className="hidden print:block signature-area">
          <div className="grid grid-cols-2 gap-16 mt-12">
            <div className="text-center signature-line">
              <p className="font-bold mb-2">Funcionário</p>
              <p>{os.funcionario?.nome}</p>
            </div>
            <div className="text-center signature-line">
              <p className="font-bold mb-2">Responsável</p>
              <p className="text-muted-foreground print:text-black">_____________________</p>
            </div>
          </div>
          <p className="text-center text-xs mt-8 text-muted-foreground print:text-black">
            Documento gerado automaticamente em {new Date().toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Botões de ação - não aparecem na impressão */}
        <div className="flex gap-2 no-print">
          {os.status === 'rascunho' && (
            <Button onClick={handleConfirmar}>Confirmar OS</Button>
          )}
          {(os.status === 'rascunho' || os.status === 'confirmada') && (
            <Button variant="destructive" onClick={handleCancelar}>
              Cancelar OS
            </Button>
          )}
          {os.status === 'confirmada' && (
            <Button variant="outline" onClick={() => setShowDevolucao(true)}>
              Registrar Devolução
            </Button>
          )}
        </div>
      </div>

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