import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Pencil, PackagePlus, Clock } from 'lucide-react';

interface Item {
  id: string;
  nome: string;
  codigo: string | null;
  categoria: string | null;
  unidade: string;
  qtd_atual: number;
  estoque_minimo: number;
  updated_at: string | null;
}

interface HistoricoItem {
  id: string;
  created_at: string;
  quantidade: number | null;
  tipo: string;
  descricao: string | null;
  usuario_id: string | null;
}

export default function Itens() {
  const { usuario } = useAuth();
  const [itens, setItens] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingItem, setUpdatingItem] = useState<Item | null>(null);
  const [historicoItem, setHistoricoItem] = useState<Item | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState(0);
  const [form, setForm] = useState({
    nome: '',
    codigo: '',
    categoria: '',
    unidade: 'un',
    qtd_atual: 0,
    estoque_minimo: 0,
  });
  const { toast } = useToast();

  const fetchItens = async () => {
    const { data, error } = await supabase
      .from('itens')
      .select('*')
      .order('nome');

    if (error) {
      toast({ title: 'Erro ao carregar itens', variant: 'destructive' });
    } else {
      setItens(data || []);
    }
    setIsLoading(false);
  };

  const handleOpenUpdate = (item: Item) => {
    setUpdatingItem(item);
    setQuantidadeAdicionar(0);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateQuantidade = async () => {
    if (!updatingItem || quantidadeAdicionar <= 0) {
      toast({ title: 'Informe uma quantidade válida', variant: 'destructive' });
      return;
    }

    const novaQuantidade = (updatingItem.qtd_atual || 0) + quantidadeAdicionar;

    // Atualizar quantidade no banco
    const { error: updateError } = await supabase
      .from('itens')
      .update({
        qtd_atual: novaQuantidade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatingItem.id);

    if (updateError) {
      toast({ title: 'Erro ao atualizar quantidade', variant: 'destructive' });
      return;
    }

    // Registrar movimentação
    await supabase.from('movimentacoes').insert({
      tipo: 'entrada' as const,
      item_id: updatingItem.id,
      quantidade: quantidadeAdicionar,
      usuario_id: usuario?.id,
      descricao: `Entrada manual: +${quantidadeAdicionar} ${updatingItem.unidade}`,
    });

    toast({
      title: 'Quantidade atualizada!',
      description: `${updatingItem.nome}: ${updatingItem.qtd_atual} → ${novaQuantidade} ${updatingItem.unidade}`,
    });

    setIsUpdateDialogOpen(false);
    setQuantidadeAdicionar(0);
    setUpdatingItem(null);
    fetchItens();
  };

  const handleViewHistorico = async (item: Item) => {
    setHistoricoItem(item);
    
    // Buscar histórico de movimentações deste item
    const { data, error } = await supabase
      .from('movimentacoes')
      .select('*')
      .eq('item_id', item.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: 'Erro ao carregar histórico', variant: 'destructive' });
    } else {
      setHistorico(data || []);
      setIsHistoricoOpen(true);
    }
  };

  useEffect(() => {
    fetchItens();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ nome: '', codigo: '', categoria: '', unidade: 'un', qtd_atual: 0, estoque_minimo: 0 });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({
      nome: item.nome,
      codigo: item.codigo || '',
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
          codigo: form.codigo.trim() || null,
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
        codigo: form.codigo.trim() || null,
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
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Qtd Atual</TableHead>
              <TableHead>Estoque Mínimo</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Nenhum item cadastrado
                </TableCell>
              </TableRow>
            ) : (
              itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.codigo || '-'}</TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.categoria || '-'}</TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell className="font-semibold">{item.qtd_atual}</TableCell>
                  <TableCell>{item.estoque_minimo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.updated_at
                      ? new Date(item.updated_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {item.qtd_atual <= item.estoque_minimo ? (
                      <Badge variant="destructive">Alerta</Badge>
                    ) : (
                      <Badge variant="default">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenUpdate(item)}
                        title="Adicionar quantidade"
                      >
                        <PackagePlus size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewHistorico(item)}
                        title="Ver histórico"
                      >
                        <Clock size={14} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                        <Pencil size={14} />
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
              <DialogTitle>{editingId ? 'Editar Item' : 'Novo Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código</Label>
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ex: ITM-001, COD-123"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Código de identificação do item (opcional)
                </p>
              </div>
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

        {/* Dialog para atualizar quantidade */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Quantidade ao Estoque</DialogTitle>
            </DialogHeader>
            {updatingItem && (
              <div className="space-y-4">
                <div>
                  <Label>Item</Label>
                  <p className="text-lg font-semibold">{updatingItem.nome}</p>
                </div>
                <div>
                  <Label>Quantidade Atual</Label>
                  <p className="text-2xl font-bold text-primary">
                    {updatingItem.qtd_atual} {updatingItem.unidade}
                  </p>
                </div>
                <div>
                  <Label>Quantidade a Adicionar *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantidadeAdicionar || ''}
                    onChange={(e) => setQuantidadeAdicionar(parseInt(e.target.value) || 0)}
                    placeholder="Digite a quantidade"
                    autoFocus
                  />
                </div>
                {quantidadeAdicionar > 0 && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">Nova quantidade:</p>
                    <p className="text-xl font-bold">
                      {updatingItem.qtd_atual + quantidadeAdicionar} {updatingItem.unidade}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateQuantidade} disabled={quantidadeAdicionar <= 0}>
                Confirmar Adição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para histórico */}
        <Dialog open={isHistoricoOpen} onOpenChange={setIsHistoricoOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Histórico de Atualizações: {historicoItem?.nome}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {historico.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum histórico de atualização encontrado
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-sm">
                          {new Date(h.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              h.tipo === 'entrada'
                                ? 'default'
                                : h.tipo === 'saida'
                                  ? 'secondary'
                                  : h.tipo === 'devolucao'
                                    ? 'default'
                                    : 'destructive'
                            }
                          >
                            {h.tipo === 'entrada'
                              ? 'Entrada'
                              : h.tipo === 'saida'
                                ? 'Saída'
                                : h.tipo === 'devolucao'
                                  ? 'Devolução'
                                  : h.tipo === 'cancelamento'
                                    ? 'Cancelamento'
                                    : h.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {h.tipo === 'entrada' || h.tipo === 'devolucao' ? '+' : '-'}
                          {h.quantidade || 0}
                        </TableCell>
                        <TableCell className="text-sm">{h.descricao || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHistoricoOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
