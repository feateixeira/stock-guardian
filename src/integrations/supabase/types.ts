export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      devolucao_itens: {
        Row: {
          created_at: string | null
          devolucao_id: string
          id: string
          item_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string | null
          devolucao_id: string
          id?: string
          item_id: string
          quantidade: number
        }
        Update: {
          created_at?: string | null
          devolucao_id?: string
          id?: string
          item_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "devolucao_itens_devolucao_id_fkey"
            columns: ["devolucao_id"]
            isOneToOne: false
            referencedRelation: "devolucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devolucao_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens"
            referencedColumns: ["id"]
          },
        ]
      }
      devolucao_onus: {
        Row: {
          created_at: string | null
          devolucao_id: string
          id: string
          onu_id: string
        }
        Insert: {
          created_at?: string | null
          devolucao_id: string
          id?: string
          onu_id: string
        }
        Update: {
          created_at?: string | null
          devolucao_id?: string
          id?: string
          onu_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devolucao_onus_devolucao_id_fkey"
            columns: ["devolucao_id"]
            isOneToOne: false
            referencedRelation: "devolucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devolucao_onus_onu_id_fkey"
            columns: ["onu_id"]
            isOneToOne: false
            referencedRelation: "onus"
            referencedColumns: ["id"]
          },
        ]
      }
      devolucoes: {
        Row: {
          created_at: string | null
          id: string
          observacoes: string | null
          os_id: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          observacoes?: string | null
          os_id: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          observacoes?: string | null
          os_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devolucoes_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devolucoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string | null
          documento: string | null
          id: string
          matricula: string | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          documento?: string | null
          id?: string
          matricula?: string | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          documento?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      itens: {
        Row: {
          categoria: string | null
          created_at: string | null
          estoque_minimo: number | null
          id: string
          nome: string
          qtd_atual: number | null
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          qtd_atual?: number | null
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          qtd_atual?: number | null
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          created_at: string | null
          descricao: string | null
          funcionario_id: string | null
          id: string
          item_id: string | null
          onu_id: string | null
          os_id: string | null
          quantidade: number | null
          tipo: Database["public"]["Enums"]["movimento_tipo"]
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          item_id?: string | null
          onu_id?: string | null
          os_id?: string | null
          quantidade?: number | null
          tipo: Database["public"]["Enums"]["movimento_tipo"]
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          item_id?: string | null
          onu_id?: string | null
          os_id?: string | null
          quantidade?: number | null
          tipo?: Database["public"]["Enums"]["movimento_tipo"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_onu_id_fkey"
            columns: ["onu_id"]
            isOneToOne: false
            referencedRelation: "onus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      onu_historico: {
        Row: {
          created_at: string | null
          descricao: string | null
          funcionario_id: string | null
          id: string
          onu_id: string
          os_id: string | null
          status_anterior: Database["public"]["Enums"]["onu_status"] | null
          status_novo: Database["public"]["Enums"]["onu_status"]
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          onu_id: string
          os_id?: string | null
          status_anterior?: Database["public"]["Enums"]["onu_status"] | null
          status_novo: Database["public"]["Enums"]["onu_status"]
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          onu_id?: string
          os_id?: string | null
          status_anterior?: Database["public"]["Enums"]["onu_status"] | null
          status_novo?: Database["public"]["Enums"]["onu_status"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onu_historico_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onu_historico_onu_id_fkey"
            columns: ["onu_id"]
            isOneToOne: false
            referencedRelation: "onus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onu_historico_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onu_historico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      onus: {
        Row: {
          codigo_unico: string
          created_at: string | null
          fornecedor: string | null
          funcionario_atual_id: string | null
          id: string
          modelo: string | null
          os_vinculada_id: string | null
          status: Database["public"]["Enums"]["onu_status"] | null
          updated_at: string | null
        }
        Insert: {
          codigo_unico: string
          created_at?: string | null
          fornecedor?: string | null
          funcionario_atual_id?: string | null
          id?: string
          modelo?: string | null
          os_vinculada_id?: string | null
          status?: Database["public"]["Enums"]["onu_status"] | null
          updated_at?: string | null
        }
        Update: {
          codigo_unico?: string
          created_at?: string | null
          fornecedor?: string | null
          funcionario_atual_id?: string | null
          id?: string
          modelo?: string | null
          os_vinculada_id?: string | null
          status?: Database["public"]["Enums"]["onu_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onus_funcionario_atual_id_fkey"
            columns: ["funcionario_atual_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onus_os_vinculada_fk"
            columns: ["os_vinculada_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          assinatura_base64: string | null
          assinatura_data: string | null
          assinatura_usuario_id: string | null
          created_at: string | null
          funcionario_id: string
          id: string
          numero: number
          observacoes: string | null
          status: Database["public"]["Enums"]["os_status"] | null
          updated_at: string | null
        }
        Insert: {
          assinatura_base64?: string | null
          assinatura_data?: string | null
          assinatura_usuario_id?: string | null
          created_at?: string | null
          funcionario_id: string
          id?: string
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["os_status"] | null
          updated_at?: string | null
        }
        Update: {
          assinatura_base64?: string | null
          assinatura_data?: string | null
          assinatura_usuario_id?: string | null
          created_at?: string | null
          funcionario_id?: string
          id?: string
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["os_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_assinatura_usuario_id_fkey"
            columns: ["assinatura_usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      os_itens: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          os_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          os_id: string
          quantidade?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          os_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_itens_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      os_onus: {
        Row: {
          created_at: string | null
          id: string
          onu_id: string
          os_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          onu_id: string
          os_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          onu_id?: string
          os_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_onus_onu_id_fkey"
            columns: ["onu_id"]
            isOneToOne: false
            referencedRelation: "onus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_onus_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          password_hash: string
          username: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          password_hash: string
          username: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      movimento_tipo: "saida" | "entrada" | "devolucao" | "cancelamento"
      onu_status: "em_estoque" | "em_uso" | "extraviada" | "devolvida"
      os_status:
        | "rascunho"
        | "confirmada"
        | "cancelada"
        | "devolucao_parcial"
        | "encerrada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      movimento_tipo: ["saida", "entrada", "devolucao", "cancelamento"],
      onu_status: ["em_estoque", "em_uso", "extraviada", "devolvida"],
      os_status: [
        "rascunho",
        "confirmada",
        "cancelada",
        "devolucao_parcial",
        "encerrada",
      ],
    },
  },
} as const
