import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Funcionario {
  id: string;
  nome: string;
}

interface Item {
  id: string;
  nome: string;
  unidade: string;
  qtd_atual: number;
}

interface ONU {
  id: string;
  codigo_unico: string;
  modelo: string | null;
  status: string;
}

interface OSItem {
  item_id: string;
  item_nome: string;
  quantidade: number;
  unidade: string;
}

interface OSONU {
  onu_id: string;
  codigo_unico: string;
}

export default function CriarOS() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [onusDisponiveis, setOnusDisponiveis] = useState<ONU[]>([]);
  const [funcionarioId, setFuncionarioId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [osItens, setOsItens] = useState<OSItem[]>([]);
  const [osOnus, setOsOnus] = useState<OSONU[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [onuCodigo, setOnuCodigo] = useState('');
  const [onuSearchOpen, setOnuSearchOpen] = useState(false);
  const [onuSearchQuery, setOnuSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [funcRes, itensRes, onusRes] = await Promise.all([
      supabase.from('funcionarios').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('itens').select('id, nome, unidade, qtd_atual').order('nome'),
      supabase.from('onus').select('id, codigo_unico, modelo, status').eq('status', 'em_estoque').order('codigo_unico'),
    ]);

    setFuncionarios(funcRes.data || []);
    setItens(itensRes.data || []);
    setOnusDisponiveis(onusRes.data || []);
  };

  const handleAddItem = () => {
    if (!selectedItem || quantidade <= 0) return;

    const item = itens.find((i) => i.id === selectedItem);
    if (!item) return;

    const existing = osItens.find((i) => i.item_id === selectedItem);
    if (existing) {
      setOsItens(
        osItens.map((i) =>
          i.item_id === selectedItem ? { ...i, quantidade: i.quantidade + quantidade } : i
        )
      );
    } else {
      setOsItens([
        ...osItens,
        { item_id: item.id, item_nome: item.nome, quantidade, unidade: item.unidade },
      ]);
    }

    setSelectedItem('');
    setQuantidade(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setOsItens(osItens.filter((i) => i.item_id !== itemId));
  };

  // Filtrar ONUs baseado na busca (mostra máximo 10 resultados)
  const onusFiltradas = useMemo(() => {
    if (!onuSearchQuery.trim()) {
      return [];
    }
    const query = onuSearchQuery.toLowerCase();
    return onusDisponiveis
      .filter(
        (onu) =>
          onu.codigo_unico.toLowerCase().includes(query) ||
          (onu.modelo?.toLowerCase().includes(query) ?? false)
      )
      .slice(0, 10); // Limitar a 10 resultados para melhor performance
  }, [onusDisponiveis, onuSearchQuery]);

  const handleSelectOnu = (onu: ONU) => {
    if (osOnus.some((o) => o.onu_id === onu.id)) {
      toast({ title: 'ONU já adicionada', variant: 'destructive' });
      return;
    }

    setOsOnus([...osOnus, { onu_id: onu.id, codigo_unico: onu.codigo_unico }]);
    setOnuCodigo('');
    setOnuSearchQuery('');
    setOnuSearchOpen(false);
  };

  const handleAddOnu = () => {
    if (!onuCodigo.trim()) return;

    const onu = onusDisponiveis.find(
      (o) => o.codigo_unico.toLowerCase() === onuCodigo.toLowerCase()
    );

    if (!onu) {
      toast({ title: 'ONU não encontrada ou não disponível', variant: 'destructive' });
      return;
    }

    if (osOnus.some((o) => o.onu_id === onu.id)) {
      toast({ title: 'ONU já adicionada', variant: 'destructive' });
      return;
    }

    setOsOnus([...osOnus, { onu_id: onu.id, codigo_unico: onu.codigo_unico }]);
    setOnuCodigo('');
    setOnuSearchQuery('');
  };

  const handleRemoveOnu = (onuId: string) => {
    setOsOnus(osOnus.filter((o) => o.onu_id !== onuId));
  };

  const handleSave = async () => {
    if (!funcionarioId) {
      toast({ title: 'Selecione um funcionário', variant: 'destructive' });
      return;
    }

    if (osItens.length === 0 && osOnus.length === 0) {
      toast({ title: 'Adicione pelo menos um item ou ONU', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const { data: os, error: osError } = await supabase
      .from('ordens_servico')
      .insert({
        funcionario_id: funcionarioId,
        observacoes: observacoes || null,
        status: 'rascunho',
      })
      .select()
      .single();

    if (osError || !os) {
      toast({ title: 'Erro ao criar OS', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (osItens.length > 0) {
      await supabase.from('os_itens').insert(
        osItens.map((i) => ({
          os_id: os.id,
          item_id: i.item_id,
          quantidade: i.quantidade,
        }))
      );
    }

    if (osOnus.length > 0) {
      await supabase.from('os_onus').insert(
        osOnus.map((o) => ({
          os_id: os.id,
          onu_id: o.onu_id,
        }))
      );
    }

    toast({ title: 'OS criada como rascunho' });
    navigate(`/os/${os.id}`);
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Criar Ordem de Serviço</h1>

        <Card>
          <CardHeader>
            <CardTitle>Dados da OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Funcionário *</Label>
              <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {itens.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome} (Disp: {i.qtd_atual} {i.unidade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                className="w-24"
                placeholder="Qtd"
              />
              <Button onClick={handleAddItem}>
                <Plus size={16} />
              </Button>
            </div>

            {osItens.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {osItens.map((i) => (
                    <TableRow key={i.item_id}>
                      <TableCell>{i.item_nome}</TableCell>
                      <TableCell>{i.quantidade}</TableCell>
                      <TableCell>{i.unidade}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveItem(i.item_id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ONUs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative flex gap-2">
              <div className="flex-1 relative">
              <Input
                value={onuCodigo}
                  onChange={(e) => {
                    const value = e.target.value;
                    setOnuCodigo(value);
                    setOnuSearchQuery(value);
                    setOnuSearchOpen(value.trim().length > 0);
                  }}
                  onFocus={() => {
                    if (onuCodigo.trim()) {
                      setOnuSearchOpen(true);
                    }
                  }}
                  onBlur={(e) => {
                    // Delay para permitir clique nos itens
                    setTimeout(() => {
                      if (!e.currentTarget.contains(document.activeElement)) {
                        setOnuSearchOpen(false);
                      }
                    }, 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (onusFiltradas.length === 1 && !osOnus.some((o) => o.onu_id === onusFiltradas[0].id)) {
                        handleSelectOnu(onusFiltradas[0]);
                      } else {
                        handleAddOnu();
                      }
                    } else if (e.key === 'Escape') {
                      setOnuSearchOpen(false);
                    }
                  }}
                  placeholder="Digite o código da ONU para buscar..."
                  className="w-full"
                  autoComplete="off"
                />
                {onuSearchOpen && onuCodigo.trim() && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {onusFiltradas.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Nenhuma ONU encontrada
                      </div>
                    ) : (
                      <div className="p-1">
                        {onusFiltradas.map((onu) => {
                          const isSelected = osOnus.some((o) => o.onu_id === onu.id);
                          return (
                            <div
                              key={onu.id}
                              onClick={() => !isSelected && handleSelectOnu(onu)}
                              onMouseDown={(e) => e.preventDefault()} // Previne blur do input
                              className={cn(
                                'p-2 rounded-sm cursor-pointer hover:bg-accent',
                                isSelected && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="font-mono font-medium text-sm">
                                    {onu.codigo_unico}
                                  </span>
                                  {onu.modelo && (
                                    <span className="text-xs text-muted-foreground">
                                      {onu.modelo}
                                    </span>
                                  )}
                                </div>
                                {isSelected && (
                                  <span className="text-xs text-muted-foreground">
                                    Já adicionada
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button onClick={handleAddOnu} disabled={!onuCodigo.trim()}>
                <Plus size={16} />
              </Button>
            </div>

            {osOnus.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código ONU</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {osOnus.map((o) => (
                    <TableRow key={o.onu_id}>
                      <TableCell className="font-mono">{o.codigo_unico}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveOnu(o.onu_id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/os')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
