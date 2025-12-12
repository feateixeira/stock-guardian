import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Download } from 'lucide-react';

interface OS {
  id: string;
  numero: number;
  status: string;
  created_at: string;
  funcionario: { nome: string } | null;
}

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  devolucao_parcial: 'Dev. Parcial',
  encerrada: 'Encerrada',
};

export default function OSLista() {
  const [osList, setOsList] = useState<OS[]>([]);
  const [funcionarios, setFuncionarios] = useState<{ id: string; nome: string }[]>([]);
  const [filtroFunc, setFiltroFunc] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.from('funcionarios').select('id, nome').order('nome').then(({ data }) => setFuncionarios(data || []));
    fetchOS();
  }, []);

  const fetchOS = async () => {
    setIsLoading(true);
    let query = supabase.from('ordens_servico').select('id, numero, status, created_at, funcionario:funcionarios(nome)').order('numero', { ascending: false });
    
    if (filtroFunc) query = query.eq('funcionario_id', filtroFunc);
    if (filtroStatus) query = query.eq('status', filtroStatus);
    if (dataInicio) query = query.gte('created_at', dataInicio);
    if (dataFim) query = query.lte('created_at', dataFim + 'T23:59:59');

    const { data } = await query;
    setOsList(data || []);
    setIsLoading(false);
  };

  const exportCSV = () => {
    const csv = ['Numero,Funcionario,Data,Status'].concat(
      osList.map(os => `${os.numero},"${os.funcionario?.nome || ''}",${new Date(os.created_at).toLocaleString('pt-BR')},${statusLabels[os.status]}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ordens_servico.csv';
    a.click();
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
          <Button onClick={exportCSV}><Download size={16} className="mr-2" />Exportar CSV</Button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div>
            <Label>Funcionário</Label>
            <Select value={filtroFunc} onValueChange={setFiltroFunc}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data Início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
          <div><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={fetchOS}>Filtrar</Button></div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow> :
              osList.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center">Nenhuma OS</TableCell></TableRow> :
              osList.map(os => (
                <TableRow key={os.id}>
                  <TableCell>#{os.numero}</TableCell>
                  <TableCell>{os.funcionario?.nome}</TableCell>
                  <TableCell>{new Date(os.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell><Badge>{statusLabels[os.status]}</Badge></TableCell>
                  <TableCell><Link to={`/os/${os.id}`}><Button size="sm" variant="outline"><Eye size={14} /></Button></Link></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}