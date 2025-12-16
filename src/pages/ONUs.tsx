import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, History } from 'lucide-react';

interface ONU {
  id: string;
  codigo_unico: string;
  modelo: string | null;
  serial: string | null;
  status: string;
  funcionario_atual_id: string | null;
  os_vinculada_id: string | null;
  funcionario?: { nome: string } | null;
}

interface ONUHistorico {
  id: string;
  status_anterior: string | null;
  status_novo: string;
  funcionario_id: string | null;
  os_id: string | null;
  descricao: string | null;
  created_at: string;
  funcionario?: { nome: string } | null;
}

export default function ONUs() {
  const [onus, setOnus] = useState<ONU[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [historico, setHistorico] = useState<ONUHistorico[]>([]);
  const [selectedOnu, setSelectedOnu] = useState<ONU | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    codigo_unico: '',
    modelo: '',
    serial: '',
    status: 'em_estoque',
  });
  const { toast } = useToast();

  const fetchOnus = async () => {
    const { data, error } = await supabase
      .from('onus')
      .select('*, funcionario:funcionarios(nome)')
      .order('codigo_unico');

    if (error) {
      toast({ title: 'Erro ao carregar ONUs', variant: 'destructive' });
    } else {
      setOnus(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOnus();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ codigo_unico: '', modelo: '', serial: '', status: 'em_estoque' });
    setIsDialogOpen(true);
  };

  const handleEdit = (onu: ONU) => {
    setEditingId(onu.id);
    setForm({
      codigo_unico: onu.codigo_unico,
      modelo: onu.modelo || '',
      serial: onu.serial || '',
      status: onu.status,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.codigo_unico.trim()) {
      toast({ title: 'Código único é obrigatório', variant: 'destructive' });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('onus')
        .update({
          codigo_unico: form.codigo_unico,
          modelo: form.modelo || null,
          serial: form.serial || null,
          status: form.status as 'em_estoque' | 'em_uso' | 'extraviada' | 'devolvida',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
      } else {
        toast({ title: 'ONU atualizada' });
        setIsDialogOpen(false);
        fetchOnus();
      }
    } else {
      const { error } = await supabase.from('onus').insert({
        codigo_unico: form.codigo_unico,
        modelo: form.modelo || null,
        serial: form.serial || null,
        status: form.status as 'em_estoque' | 'em_uso' | 'extraviada' | 'devolvida',
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Código já existe', variant: 'destructive' });
        } else {
          toast({ title: 'Erro ao criar', variant: 'destructive' });
        }
      } else {
        toast({ title: 'ONU criada' });
        setIsDialogOpen(false);
        fetchOnus();
      }
    }
  };

  const handleViewHistorico = async (onu: ONU) => {
    setSelectedOnu(onu);
    const { data } = await supabase
      .from('onu_historico')
      .select('*, funcionario:funcionarios(nome)')
      .eq('onu_id', onu.id)
      .order('created_at', { ascending: false });

    setHistorico(data || []);
    setIsHistoricoOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_estoque':
        return <Badge variant="default">Em Estoque</Badge>;
      case 'em_uso':
        return <Badge variant="secondary">Em Uso</Badge>;
      case 'extraviada':
        return <Badge variant="destructive">Extraviada</Badge>;
      case 'devolvida':
        return <Badge>Devolvida</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">ONUs</h1>
          <Button onClick={handleOpenNew}>
            <Plus size={16} className="mr-2" />
            Nova ONU
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Funcionário Atual</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : onus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhuma ONU cadastrada
                </TableCell>
              </TableRow>
            ) : (
              onus.map((onu) => (
                <TableRow key={onu.id}>
                  <TableCell className="font-mono">{onu.codigo_unico}</TableCell>
                  <TableCell className="font-mono">{onu.serial || '-'}</TableCell>
                  <TableCell>{onu.modelo || '-'}</TableCell>
                  <TableCell>{getStatusBadge(onu.status)}</TableCell>
                  <TableCell>{onu.funcionario?.nome || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(onu)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewHistorico(onu)}
                      >
                        <History size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar ONU' : 'Nova ONU'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código Único *</Label>
                <Input
                  value={form.codigo_unico}
                  onChange={(e) => setForm({ ...form, codigo_unico: e.target.value })}
                />
              </div>
              <div>
                <Label>Serial</Label>
                <Input
                  value={form.serial}
                  onChange={(e) => setForm({ ...form, serial: e.target.value })}
                  placeholder="Número de série"
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_estoque">Em Estoque</SelectItem>
                    <SelectItem value="em_uso">Em Uso</SelectItem>
                    <SelectItem value="extraviada">Extraviada</SelectItem>
                    <SelectItem value="devolvida">Devolvida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isHistoricoOpen} onOpenChange={setIsHistoricoOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico da ONU: {selectedOnu?.codigo_unico}</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status Anterior</TableHead>
                    <TableHead>Novo Status</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Nenhum histórico
                      </TableCell>
                    </TableRow>
                  ) : (
                    historico.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>
                          {new Date(h.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{h.status_anterior || '-'}</TableCell>
                        <TableCell>{h.status_novo}</TableCell>
                        <TableCell>{h.funcionario?.nome || '-'}</TableCell>
                        <TableCell>{h.descricao || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
