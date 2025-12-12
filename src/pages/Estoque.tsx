import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle } from 'lucide-react';

export default function Estoque() {
  const [itens, setItens] = useState<any[]>([]);
  const [onusEmUso, setOnusEmUso] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('itens').select('*').order('nome').then(({ data }) => setItens(data || []));
    supabase.from('onus').select('*, funcionario:funcionarios(nome), os:ordens_servico(numero, created_at)').eq('status', 'em_uso').order('codigo_unico').then(({ data }) => setOnusEmUso(data || []));
  }, []);

  const alertas = itens.filter(i => i.qtd_atual <= i.estoque_minimo);

  const exportOnusCSV = () => {
    const csv = ['Codigo,Modelo,Funcionario,OS,Data'].concat(
      onusEmUso.map(o => `${o.codigo_unico},"${o.modelo || ''}","${o.funcionario?.nome || ''}",${o.os?.numero || ''},${o.os?.created_at ? new Date(o.os.created_at).toLocaleDateString('pt-BR') : ''}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'onus_em_uso.csv';
    a.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Estoque Atual</h1>

        {alertas.length > 0 && (
          <Card className="border-warning">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-warning"><AlertTriangle />Itens em Alerta ({alertas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Atual</TableHead><TableHead>Mínimo</TableHead></TableRow></TableHeader>
                <TableBody>
                  {alertas.map(i => (
                    <TableRow key={i.id}>
                      <TableCell>{i.nome}</TableCell>
                      <TableCell><Badge variant="destructive">{i.qtd_atual}</Badge></TableCell>
                      <TableCell>{i.estoque_minimo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Todos os Itens</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Qtd</TableHead><TableHead>Un</TableHead><TableHead>Mín</TableHead></TableRow></TableHeader>
              <TableBody>
                {itens.map(i => (
                  <TableRow key={i.id} className={i.qtd_atual <= i.estoque_minimo ? 'bg-destructive/10' : ''}>
                    <TableCell>{i.nome}</TableCell>
                    <TableCell>{i.categoria || '-'}</TableCell>
                    <TableCell>{i.qtd_atual}</TableCell>
                    <TableCell>{i.unidade}</TableCell>
                    <TableCell>{i.estoque_minimo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>ONUs em Uso ({onusEmUso.length})</CardTitle>
            <Button size="sm" onClick={exportOnusCSV}><Download size={14} className="mr-2" />Exportar CSV</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Modelo</TableHead><TableHead>Funcionário</TableHead><TableHead>OS</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
              <TableBody>
                {onusEmUso.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.codigo_unico}</TableCell>
                    <TableCell>{o.modelo || '-'}</TableCell>
                    <TableCell>{o.funcionario?.nome || '-'}</TableCell>
                    <TableCell>#{o.os?.numero || '-'}</TableCell>
                    <TableCell>{o.os?.created_at ? new Date(o.os.created_at).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}