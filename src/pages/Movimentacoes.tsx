import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';

const tipoLabels: Record<string, string> = { saida: 'Saída', entrada: 'Entrada', devolucao: 'Devolução', cancelamento: 'Cancelamento' };

export default function Movimentacoes() {
  const [movs, setMovs] = useState<any[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => { fetchMovs(); }, []);

  const fetchMovs = async () => {
    let query = supabase.from('movimentacoes').select('*, item:itens(nome), onu:onus(codigo_unico), funcionario:funcionarios(nome), usuario:usuarios(nome), os:ordens_servico(numero)').order('created_at', { ascending: false }).limit(500);
    if (dataInicio) query = query.gte('created_at', dataInicio);
    if (dataFim) query = query.lte('created_at', dataFim + 'T23:59:59');
    const { data } = await query;
    setMovs(data || []);
  };

  const exportCSV = () => {
    const csv = ['Data,Tipo,Item/ONU,Qtd/Codigo,OS,Funcionario,Usuario'].concat(
      movs.map(m => `${new Date(m.created_at).toLocaleString('pt-BR')},${tipoLabels[m.tipo]},"${m.item?.nome || m.onu?.codigo_unico || ''}",${m.quantidade || m.onu?.codigo_unico || ''},${m.os?.numero || ''},"${m.funcionario?.nome || ''}","${m.usuario?.nome || ''}"`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'movimentacoes.csv';
    a.click();
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Histórico de Movimentações</h1>
          <Button onClick={exportCSV}><Download size={16} className="mr-2" />Exportar CSV</Button>
        </div>

        <div className="flex gap-4 items-end">
          <div><Label>Data Início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
          <div><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
          <Button onClick={fetchMovs}>Filtrar</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Item/ONU</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movs.map(m => (
              <TableRow key={m.id}>
                <TableCell>{new Date(m.created_at).toLocaleString('pt-BR')}</TableCell>
                <TableCell><Badge variant={m.tipo === 'saida' ? 'destructive' : m.tipo === 'entrada' ? 'default' : 'secondary'}>{tipoLabels[m.tipo]}</Badge></TableCell>
                <TableCell>{m.item?.nome || <span className="font-mono">{m.onu?.codigo_unico}</span>}</TableCell>
                <TableCell>{m.quantidade || '-'}</TableCell>
                <TableCell>{m.os?.numero ? `#${m.os.numero}` : '-'}</TableCell>
                <TableCell>{m.funcionario?.nome || '-'}</TableCell>
                <TableCell>{m.usuario?.nome || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{m.descricao}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}