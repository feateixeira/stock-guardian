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
import { Plus, Pencil } from 'lucide-react';

interface Item {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: string;
  qtd_atual: number;
  estoque_minimo: number;
}

export default function Itens() {
  const [itens, setItens] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    categoria: '',
    unidade: 'un',
    qtd_atual: 0,
    estoque_minimo: 0,
  });
  const { toast } = useToast();

  const fetchItens = async () => {
    const { data, error } = await supabase.from('itens').select('*').order('nome');

    if (error) {
      toast({ title: 'Erro ao carregar itens', variant: 'destructive' });
    } else {
      setItens(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItens();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ nome: '', categoria: '', unidade: 'un', qtd_atual: 0, estoque_minimo: 0 });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({
      nome: item.nome,
      categoria: item.categoria || '',
      unidade: item.unidade,
      qtd_atual: item.qtd_atual,
      estoque_minimo: item.estoque_minimo,
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
        .from('itens')
        .update({
          nome: form.nome,
          categoria: form.categoria || null,
          unidade: form.unidade,
          qtd_atual: form.qtd_atual,
          estoque_minimo: form.estoque_minimo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
      } else {
        toast({ title: 'Item atualizado' });
        setIsDialogOpen(false);
        fetchItens();
      }
    } else {
      const { error } = await supabase.from('itens').insert({
        nome: form.nome,
        categoria: form.categoria || null,
        unidade: form.unidade,
        qtd_atual: form.qtd_atual,
        estoque_minimo: form.estoque_minimo,
      });

      if (error) {
        toast({ title: 'Erro ao criar', variant: 'destructive' });
      } else {
        toast({ title: 'Item criado' });
        setIsDialogOpen(false);
        fetchItens();
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Itens de Estoque</h1>
          <Button onClick={handleOpenNew}>
            <Plus size={16} className="mr-2" />
            Novo Item
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Qtd Atual</TableHead>
              <TableHead>Estoque Mínimo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Nenhum item cadastrado
                </TableCell>
              </TableRow>
            ) : (
              itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.categoria || '-'}</TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell>{item.qtd_atual}</TableCell>
                  <TableCell>{item.estoque_minimo}</TableCell>
                  <TableCell>
                    {item.qtd_atual <= item.estoque_minimo ? (
                      <Badge variant="destructive">Alerta</Badge>
                    ) : (
                      <Badge variant="default">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Item' : 'Novo Item'}</DialogTitle>
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
                <Label>Categoria</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Select
                  value={form.unidade}
                  onValueChange={(value) => setForm({ ...form, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="m">Metro (m)</SelectItem>
                    <SelectItem value="cx">Caixa (cx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade Atual</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.qtd_atual}
                    onChange={(e) =>
                      setForm({ ...form, qtd_atual: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label>Estoque Mínimo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.estoque_minimo}
                    onChange={(e) =>
                      setForm({ ...form, estoque_minimo: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
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
