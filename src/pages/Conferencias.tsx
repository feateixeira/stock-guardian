import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardCheck, Save, History, AlertCircle } from 'lucide-react';

interface Funcionario {
  id: string;
  nome: string;
  cargo: string | null;
}

interface ONUParaConferir {
  id: string;
  codigo_unico: string;
  modelo: string | null;
  os_numero: number | null;
  conferido: boolean;
  status: 'ok' | 'faltando' | 'extraviada';
  observacoes: string;
}

interface ItemParaConferir {
  item_id: string;
  nome: string;
  codigo: string | null;
  quantidade_total: number;
  quantidade_conferida: number;
  unidade: string;
  os_ids: string[];
  os_numeros: number[];
  conferido: boolean;
  status: 'ok' | 'faltando' | 'excedente';
  observacoes: string;
}

interface ConferenciaHistorico {
  id: string;
  data_conferencia: string;
  funcionario_nome: string;
  usuario_nome: string;
  total_itens: number;
  total_onus: number;
  observacoes: string | null;
}

export default function Conferencias() {
  const { usuario } = useAuth();
  const { toast } = useToast();
  
  // Estado para nova conferência
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>('');
  const [onusParaConferir, setOnusParaConferir] = useState<ONUParaConferir[]>([]);
  const [itensParaConferir, setItensParaConferir] = useState<ItemParaConferir[]>([]);
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [isLoadingDados, setIsLoadingDados] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para histórico
  const [historico, setHistorico] = useState<ConferenciaHistorico[]>([]);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);

  // Carregar funcionários ativos
  useEffect(() => {
    const fetchFuncionarios = async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, cargo')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        toast({ title: 'Erro ao carregar funcionários', variant: 'destructive' });
      } else {
        setFuncionarios(data || []);
      }
    };

    fetchFuncionarios();
    fetchHistorico();
  }, []);

  // Carregar histórico de conferências
  const fetchHistorico = async () => {
    setIsLoadingHistorico(true);
    try {
      const { data: conferencias, error } = await supabase
        .from('conferencias')
        .select(`
          id,
          data_conferencia,
          observacoes,
          funcionario:funcionarios(nome),
          usuario:usuarios(nome)
        `)
        .order('data_conferencia', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Buscar contagens de itens e ONUs para cada conferência
      const historicoComContagens = await Promise.all(
        (conferencias || []).map(async (conf: any) => {
          const [itensResult, onusResult] = await Promise.all([
            supabase
              .from('conferencia_itens')
              .select('id', { count: 'exact', head: true })
              .eq('conferencia_id', conf.id),
            supabase
              .from('conferencia_onus')
              .select('id', { count: 'exact', head: true })
              .eq('conferencia_id', conf.id),
          ]);

          return {
            id: conf.id,
            data_conferencia: conf.data_conferencia,
            funcionario_nome: conf.funcionario?.nome || 'N/A',
            usuario_nome: conf.usuario?.nome || 'N/A',
            total_itens: itensResult.count || 0,
            total_onus: onusResult.count || 0,
            observacoes: conf.observacoes,
          };
        })
      );

      setHistorico(historicoComContagens);
    } catch (error) {
      toast({ title: 'Erro ao carregar histórico', variant: 'destructive' });
    } finally {
      setIsLoadingHistorico(false);
    }
  };

  // Carregar dados do funcionário selecionado
  const handleFuncionarioChange = async (funcionarioId: string) => {
    setFuncionarioSelecionado(funcionarioId);
    setOnusParaConferir([]);
    setItensParaConferir([]);
    setObservacoesGerais('');

    if (!funcionarioId) return;

    setIsLoadingDados(true);
    try {
      // Buscar ONUs em uso do funcionário
      const { data: onusData, error: onusError } = await supabase
        .from('onus')
        .select('id, codigo_unico, modelo, os_vinculada_id, os:ordens_servico(numero)')
        .eq('funcionario_atual_id', funcionarioId)
        .eq('status', 'em_uso')
        .order('codigo_unico');

      if (onusError) throw onusError;

      const onusFormatadas: ONUParaConferir[] = (onusData || []).map((onu: any) => ({
        id: onu.id,
        codigo_unico: onu.codigo_unico,
        modelo: onu.modelo,
        os_numero: onu.os?.numero || null,
        conferido: false,
        status: 'ok',
        observacoes: '',
      }));

      setOnusParaConferir(onusFormatadas);

      // Buscar itens de OS confirmadas do funcionário
      const { data: osData, error: osError } = await supabase
        .from('ordens_servico')
        .select('id, numero')
        .eq('funcionario_id', funcionarioId)
        .eq('status', 'confirmada');

      if (osError) throw osError;

      if (osData && osData.length > 0) {
        const osIds = osData.map((os) => os.id);
        
        // Buscar itens dessas OS
        const { data: osItensData, error: itensError } = await supabase
          .from('os_itens')
          .select('os_id, item_id, quantidade, item:itens(nome, codigo, unidade)')
          .in('os_id', osIds);

        if (itensError) throw itensError;

        // Agrupar itens por item_id
        const itensAgrupados = new Map<string, ItemParaConferir>();
        
        (osItensData || []).forEach((osItem: any) => {
          const itemId = osItem.item_id;
          const osId = osItem.os_id;
          const osNumero = osData.find((os) => os.id === osId)?.numero || 0;

          if (itensAgrupados.has(itemId)) {
            const item = itensAgrupados.get(itemId)!;
            item.quantidade_total += osItem.quantidade;
            if (!item.os_ids.includes(osId)) {
              item.os_ids.push(osId);
              item.os_numeros.push(osNumero);
            }
          } else {
            itensAgrupados.set(itemId, {
              item_id: itemId,
              nome: osItem.item?.nome || '',
              codigo: osItem.item?.codigo || null,
              quantidade_total: osItem.quantidade,
              quantidade_conferida: osItem.quantidade,
              unidade: osItem.item?.unidade || 'un',
              os_ids: [osId],
              os_numeros: [osNumero],
              conferido: false,
              status: 'ok',
              observacoes: '',
            });
          }
        });

        setItensParaConferir(Array.from(itensAgrupados.values()));
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoadingDados(false);
    }
  };

  // Atualizar status da ONU
  const handleOnuChange = (index: number, field: keyof ONUParaConferir, value: any) => {
    const novasOnus = [...onusParaConferir];
    novasOnus[index] = { ...novasOnus[index], [field]: value };
    setOnusParaConferir(novasOnus);
  };

  // Atualizar item
  const handleItemChange = (index: number, field: keyof ItemParaConferir, value: any) => {
    const novosItens = [...itensParaConferir];
    novosItens[index] = { ...novosItens[index], [field]: value };
    
    // Calcular status automaticamente se a quantidade conferida mudou
    if (field === 'quantidade_conferida') {
      const item = novosItens[index];
      if (item.quantidade_conferida === item.quantidade_total) {
        item.status = 'ok';
      } else if (item.quantidade_conferida < item.quantidade_total) {
        item.status = 'faltando';
      } else {
        item.status = 'excedente';
      }
    }
    
    setItensParaConferir(novosItens);
  };

  // Salvar conferência
  const handleSalvarConferencia = async () => {
    if (!funcionarioSelecionado) {
      toast({ title: 'Selecione um funcionário', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      // Criar conferência
      const { data: conferencia, error: confError } = await supabase
        .from('conferencias')
        .insert({
          funcionario_id: funcionarioSelecionado,
          usuario_id: usuario?.id,
          data_conferencia: new Date().toISOString(),
          observacoes: observacoesGerais || null,
        })
        .select()
        .single();

      if (confError) throw confError;

      // Salvar ONUs conferidas
      if (onusParaConferir.length > 0) {
        const onusParaSalvar = onusParaConferir.map((onu) => ({
          conferencia_id: conferencia.id,
          onu_id: onu.id,
          status: onu.status,
          observacoes: onu.observacoes || null,
        }));

        const { error: onusError } = await supabase
          .from('conferencia_onus')
          .insert(onusParaSalvar);

        if (onusError) throw onusError;
      }

      // Salvar itens conferidos
      if (itensParaConferir.length > 0) {
        const itensParaSalvar = itensParaConferir.flatMap((item) =>
          item.os_ids.map((osId) => ({
            conferencia_id: conferencia.id,
            item_id: item.item_id,
            os_id: osId,
            quantidade_esperada: item.quantidade_total,
            quantidade_conferida: item.quantidade_conferida,
            status: item.status,
            observacoes: item.observacoes || null,
          }))
        );

        const { error: itensError } = await supabase
          .from('conferencia_itens')
          .insert(itensParaSalvar);

        if (itensError) throw itensError;
      }

      toast({ title: 'Conferência salva com sucesso!' });
      
      // Resetar formulário
      setFuncionarioSelecionado('');
      setOnusParaConferir([]);
      setItensParaConferir([]);
      setObservacoesGerais('');
      
      // Atualizar histórico
      fetchHistorico();
    } catch (error: any) {
      console.error('Erro ao salvar conferência:', error);
      toast({ 
        title: 'Erro ao salvar conferência', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      ok: 'default',
      faltando: 'destructive',
      excedente: 'secondary',
      extraviada: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Conferências de Itens e ONUs</h1>
        </div>

        {/* Nova Conferência */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Conferência</CardTitle>
            <CardDescription>
              Selecione um funcionário para conferir os itens e ONUs em seu nome
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Funcionário</Label>
              <Select value={funcionarioSelecionado} onValueChange={handleFuncionarioChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((func) => (
                    <SelectItem key={func.id} value={func.id}>
                      {func.nome} {func.cargo ? `- ${func.cargo}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoadingDados && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando dados...
              </div>
            )}

            {funcionarioSelecionado && !isLoadingDados && (
              <>
                {/* ONUs */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    ONUs Atribuídas ({onusParaConferir.length})
                  </h3>
                  {onusParaConferir.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma ONU atribuída</p>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">✓</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>OS</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {onusParaConferir.map((onu, index) => (
                            <TableRow key={onu.id}>
                              <TableCell>
                                <Checkbox
                                  checked={onu.conferido}
                                  onCheckedChange={(checked) =>
                                    handleOnuChange(index, 'conferido', checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-mono">{onu.codigo_unico}</TableCell>
                              <TableCell>{onu.modelo || '-'}</TableCell>
                              <TableCell>
                                {onu.os_numero ? `OS #${onu.os_numero}` : '-'}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={onu.status}
                                  onValueChange={(value) =>
                                    handleOnuChange(index, 'status', value)
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ok">OK</SelectItem>
                                    <SelectItem value="faltando">Faltando</SelectItem>
                                    <SelectItem value="extraviada">Extraviada</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Observações..."
                                  value={onu.observacoes}
                                  onChange={(e) =>
                                    handleOnuChange(index, 'observacoes', e.target.value)
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Itens */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Itens Fornecidos ({itensParaConferir.length})
                  </h3>
                  {itensParaConferir.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum item fornecido</p>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">✓</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>OS</TableHead>
                            <TableHead>Esperado</TableHead>
                            <TableHead>Conferido</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itensParaConferir.map((item, index) => (
                            <TableRow key={item.item_id}>
                              <TableCell>
                                <Checkbox
                                  checked={item.conferido}
                                  onCheckedChange={(checked) =>
                                    handleItemChange(index, 'conferido', checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {item.codigo || '-'}
                              </TableCell>
                              <TableCell>{item.nome}</TableCell>
                              <TableCell className="text-sm">
                                {item.os_numeros.map((num) => `#${num}`).join(', ')}
                              </TableCell>
                              <TableCell>
                                {item.quantidade_total} {item.unidade}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  className="w-20"
                                  value={item.quantidade_conferida}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      'quantidade_conferida',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>{getStatusBadge(item.status)}</TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Observações..."
                                  value={item.observacoes}
                                  onChange={(e) =>
                                    handleItemChange(index, 'observacoes', e.target.value)
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Observações Gerais */}
                <div>
                  <Label>Observações Gerais</Label>
                  <Textarea
                    placeholder="Observações sobre a conferência..."
                    value={observacoesGerais}
                    onChange={(e) => setObservacoesGerais(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Botão Salvar */}
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setFuncionarioSelecionado('');
                      setOnusParaConferir([]);
                      setItensParaConferir([]);
                      setObservacoesGerais('');
                    }}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSalvarConferencia} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Conferência'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Conferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistorico ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando histórico...
              </div>
            ) : historico.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma conferência realizada ainda
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Conferido por</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>ONUs</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((conf) => (
                    <TableRow key={conf.id}>
                      <TableCell>
                        {new Date(conf.data_conferencia).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{conf.funcionario_nome}</TableCell>
                      <TableCell>{conf.usuario_nome}</TableCell>
                      <TableCell>{conf.total_itens}</TableCell>
                      <TableCell>{conf.total_onus}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {conf.observacoes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
