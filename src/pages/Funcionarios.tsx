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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Package } from 'lucide-react';

interface Funcionario {
  id: string;
  nome: string;
  cargo: string | null;
  documento: string | null;
  matricula: string | null;
  ativo: boolean;
}

interface ONUAtribuida {
  id: string;
  codigo_unico: string;
  modelo: string | null;
  status: string;
  os_vinculada_id: string | null;
  os?: { numero: number } | null;
}

interface ItemOS {
  id: string;
  nome: string;
  codigo: string | null;
  quantidade: number;
  unidade: string;
  os_numero: number;
  os_id: string;
  os_data: string;
}

interface OSInfo {
  id: string;
  numero: number;
  created_at: string;
}

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEquipamentosOpen, setIsEquipamentosOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [onusAtribuidas, setOnusAtribuidas] = useState<ONUAtribuida[]>([]);
  const [itensOS, setItensOS] = useState<ItemOS[]>([]);
  const [todasOS, setTodasOS] = useState<OSInfo[]>([]);
  const [osSelecionada, setOsSelecionada] = useState<string>('');
  const [isLoadingEquipamentos, setIsLoadingEquipamentos] = useState(false);
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

  const handleViewEquipamentos = async (func: Funcionario) => {
    setSelectedFuncionario(func);
    setOsSelecionada(''); // Resetar seleção ao abrir (vazio = não mostrar nada)
    setIsLoadingEquipamentos(true);
    setIsEquipamentosOpen(true);

    try {
      // Buscar ONUs atribuídas ao funcionário
      const { data: onusData, error: onusError } = await supabase
        .from('onus')
        .select('*, os:ordens_servico(numero)')
        .eq('funcionario_atual_id', func.id)
        .eq('status', 'em_uso')
        .order('codigo_unico');

      if (onusError) {
        toast({ title: 'Erro ao carregar ONUs', variant: 'destructive' });
      } else {
        setOnusAtribuidas(onusData || []);
      }

      // Buscar itens das OS confirmadas do funcionário
      const { data: osData, error: osError } = await supabase
        .from('ordens_servico')
        .select('id, numero, created_at')
        .eq('funcionario_id', func.id)
        .eq('status', 'confirmada')
        .order('created_at', { ascending: false });

      if (osError) {
        toast({ title: 'Erro ao carregar OS', variant: 'destructive' });
        setItensOS([]);
        setTodasOS([]);
      } else if (osData && osData.length > 0) {
        // Armazenar todas as OS para o dropdown
        setTodasOS(osData);
        // Buscar itens de todas as OS confirmadas
        const osIds = osData.map((os) => os.id);
        
        if (osIds.length === 0) {
          setItensOS([]);
        } else {
          // Buscar itens - buscar sem codigo primeiro (mais compatível)
          // Se o campo codigo existir, será null caso não tenha valor
          const { data: itensData, error: itensError } = await supabase
            .from('os_itens')
            .select('*, item:itens(nome, unidade)')
            .in('os_id', osIds);

          if (itensError) {
            console.error('Erro ao carregar itens:', itensError);
            toast({ 
              title: 'Erro ao carregar itens', 
              description: itensError.message || 'Erro desconhecido',
              variant: 'destructive' 
            });
            setItensOS([]);
          } else {
            // Criar mapa de OS para facilitar busca
            const osMap = new Map(osData.map((os) => [os.id, os]));
            
            // Processar e formatar dados
            const itensFormatados: ItemOS[] =
              itensData?.map((oi: any) => {
                const os = osMap.get(oi.os_id);
                return {
                  id: oi.id,
                  nome: oi.item?.nome || '',
                  codigo: null, // Campo codigo será null por enquanto até a migration ser aplicada
                  quantidade: oi.quantidade,
                  unidade: oi.item?.unidade || 'un',
                  os_numero: os?.numero || 0,
                  os_id: oi.os_id,
                  os_data: os?.created_at || '',
                };
              }) || [];
            setItensOS(itensFormatados);
          }
        }
      } else {
        setItensOS([]);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoadingEquipamentos(false);
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewEquipamentos(func)}
                        title="Ver equipamentos e itens"
                      >
                        <Package size={14} />
                      </Button>
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

        {/* Dialog para ver equipamentos e itens */}
        <Dialog open={isEquipamentosOpen} onOpenChange={setIsEquipamentosOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                Equipamentos e Itens: {selectedFuncionario?.nome}
              </DialogTitle>
            </DialogHeader>
            {isLoadingEquipamentos ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <div className="space-y-6 overflow-y-auto max-h-[70vh]">
                {/* ONUs Atribuídas */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">ONUs Atribuídas ({onusAtribuidas.length})</h3>
                  {onusAtribuidas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma ONU atribuída</p>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>OS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {onusAtribuidas.map((onu) => (
                            <TableRow key={onu.id}>
                              <TableCell className="font-mono">{onu.codigo_unico}</TableCell>
                              <TableCell>{onu.modelo || '-'}</TableCell>
                              <TableCell>
                                {onu.os ? `OS #${onu.os.numero}` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Itens das OS */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">
                      Itens Fornecidos via OS
                      {osSelecionada !== '' && osSelecionada !== 'all' && ` (${itensOS.filter(item => item.os_id === osSelecionada).length})`}
                      {osSelecionada === 'all' && ` (${itensOS.length})`}
                    </h3>
                    {todasOS.length > 0 && (
                      <Select value={osSelecionada || undefined} onValueChange={setOsSelecionada}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Selecione uma OS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as OS</SelectItem>
                          {todasOS.map((os) => (
                            <SelectItem key={os.id} value={os.id}>
                              OS #{os.numero} - {new Date(os.created_at).toLocaleDateString('pt-BR')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  {osSelecionada === '' ? (
                    <p className="text-sm text-muted-foreground">
                      Selecione uma OS acima para visualizar os itens
                    </p>
                  ) : itensOS.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum item fornecido através de OS confirmadas
                    </p>
                  ) : (() => {
                    const itensFiltrados = osSelecionada === 'all' 
                      ? itensOS 
                      : itensOS.filter(item => item.os_id === osSelecionada);
                    
                    return itensFiltrados.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum item nesta OS
                      </p>
                    ) : (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>OS</TableHead>
                              <TableHead>Data OS</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-center">Quantidade</TableHead>
                              <TableHead className="text-center">Unidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itensFiltrados.map((item, index) => (
                              <TableRow key={`${item.os_id}-${item.id}-${index}`}>
                                <TableCell className="font-semibold">#{item.os_numero}</TableCell>
                                <TableCell className="text-sm">
                                  {new Date(item.os_data).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {item.codigo || '-'}
                                </TableCell>
                                <TableCell>{item.nome}</TableCell>
                                <TableCell className="text-center font-semibold">
                                  {item.quantidade}
                                </TableCell>
                                <TableCell className="text-center">{item.unidade}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEquipamentosOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
