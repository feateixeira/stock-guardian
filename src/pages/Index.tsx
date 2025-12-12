import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, Package, Router, FileText, Warehouse, History, Plus } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const menuCards = [
    {
      title: "Funcionários",
      description: "Gerenciar cadastro de funcionários",
      icon: Users,
      path: "/funcionarios",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Itens de Estoque",
      description: "Cadastro e controle de itens",
      icon: Package,
      path: "/itens",
      color: "bg-green-500/10 text-green-600",
    },
    {
      title: "ONUs",
      description: "Gerenciar equipamentos ONU",
      icon: Router,
      path: "/onus",
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Nova OS",
      description: "Criar ordem de serviço",
      icon: Plus,
      path: "/os/nova",
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      title: "Ordens de Serviço",
      description: "Listar e gerenciar OS",
      icon: FileText,
      path: "/os",
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      title: "Estoque Atual",
      description: "Visualizar posição do estoque",
      icon: Warehouse,
      path: "/estoque",
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Movimentações",
      description: "Histórico de movimentações",
      icon: History,
      path: "/movimentacoes",
      color: "bg-rose-500/10 text-rose-600",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel Principal</h1>
          <p className="text-muted-foreground mt-1">
            Sistema de Controle de Estoque e Ordens de Serviço
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuCards.map((card) => (
            <Card
              key={card.path}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(card.path)}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-start p-0 h-auto text-primary hover:text-primary/80">
                  Acessar →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
