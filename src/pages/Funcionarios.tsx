import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil } from 'lucide-react';

interface Funcionario {
  id: string;
  nome: string;
  cargo: string | null;
  documento: string | null;
  matricula: string | null;
  ativo: boolean;
}

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    cargo: '',
    documento: '',
    matricula: '',
  });
  const { toast } = useToast();

  const fetchFuncionarios = async () => {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome');

    if (error) {
      toast({ title: 'Erro ao carregar funcionários', variant: 'destructive' });
    } else {
      setFuncionarios(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ nome: '', cargo: '', documento: '', matricula: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (func: Funcionario) => {
    setEditingId(func.id);
    setForm({
      nome: func.nome,
      cargo: func.cargo || '',
      documento: func.documento || '',
      matricula: func.matricula || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('funcionarios')
        .update({
          nome: form.nome,
          cargo: form.cargo || null,
          documento: form.documento || null,
          matricula: form.matricula || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
      } else {
        toast({ title: 'Funcionário atualizado' });
        setIsDialogOpen(false);
        fetchFuncionarios();
      }
    } else {
      const { error } = await supabase.from('funcionarios').insert({
        nome: form.nome,
        cargo: form.cargo || null,
        documento: form.documento || null,
        matricula: form.matricula || null,
      });

      if (error) {
        toast({ title: 'Erro ao criar', variant: 'destructive' });
      } else {
        toast({ title: 'Funcionário criado' });
        setIsDialogOpen(false);
        fetchFuncionarios();
      }
    }
  };

  const toggleAtivo = async (func: Funcionario) => {
    const { error } = await supabase
      .from('funcionarios')
      .update({ ativo: !func.ativo, updated_at: new Date().toISOString() })
      .eq('id', func.id);

    if (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    } else {
      fetchFuncionarios();
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <Button onClick={handleOpenNew}>
            <Plus size={16} className="mr-2" />
            Novo Funcionário
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Status</TableHead>
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
            ) : funcionarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum funcionário cadastrado
                </TableCell>
              </TableRow>
            ) : (
              funcionarios.map((func) => (
                <TableRow key={func.id}>
                  <TableCell>{func.nome}</TableCell>
                  <TableCell>{func.cargo || '-'}</TableCell>
                  <TableCell>{func.documento || '-'}</TableCell>
                  <TableCell>{func.matricula || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={func.ativo ? 'default' : 'secondary'}>
                      {func.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(func)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant={func.ativo ? 'destructive' : 'default'}
                        onClick={() => toggleAtivo(func)}
                      >
                        {func.ativo ? 'Inativar' : 'Ativar'}
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
              <DialogTitle>
                {editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                />
              </div>
              <div>
                <Label>Documento</Label>
                <Input
                  value={form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value })}
                />
              </div>
              <div>
                <Label>Matrícula</Label>
                <Input
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                />
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
      </div>
    </Layout>
  );
}
