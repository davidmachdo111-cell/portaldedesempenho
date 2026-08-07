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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      atribuicoes: {
        Row: {
          avaliador_id: string
          checklist_id: string
          created_at: string
          id: string
        }
        Insert: {
          avaliador_id: string
          checklist_id: string
          created_at?: string
          id?: string
        }
        Update: {
          avaliador_id?: string
          checklist_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atribuicoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          avaliador_id: string
          checklist_id: string
          colaborador_id: string | null
          colaborador_nome: string
          created_at: string
          data_avaliacao: string
          data_inicio: string | null
          id: string
          marcados: Json
          media: number
          observacoes: Json
          setor: string
          status: string
          tutor: string
          updated_at: string
        }
        Insert: {
          avaliador_id: string
          checklist_id: string
          colaborador_id?: string | null
          colaborador_nome?: string
          created_at?: string
          data_avaliacao?: string
          data_inicio?: string | null
          id?: string
          marcados?: Json
          media?: number
          observacoes?: Json
          setor?: string
          status?: string
          tutor?: string
          updated_at?: string
        }
        Update: {
          avaliador_id?: string
          checklist_id?: string
          colaborador_id?: string | null
          colaborador_nome?: string
          created_at?: string
          data_avaliacao?: string
          data_inicio?: string | null
          id?: string
          marcados?: Json
          media?: number
          observacoes?: Json
          setor?: string
          status?: string
          tutor?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          cor: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cor?: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      checklists: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          nome: string
          nota_minima: number
          observacoes_obrigatorias: boolean
          permite_observacoes: boolean
          pontos_desenvolvimento_modo: string
          pontos_fortes_modo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          nome: string
          nota_minima?: number
          observacoes_obrigatorias?: boolean
          permite_observacoes?: boolean
          pontos_desenvolvimento_modo?: string
          pontos_fortes_modo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          nome?: string
          nota_minima?: number
          observacoes_obrigatorias?: boolean
          permite_observacoes?: boolean
          pontos_desenvolvimento_modo?: string
          pontos_fortes_modo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_atividades: {
        Row: {
          avaliacao_id: string | null
          colaborador_id: string
          concluida_em: string | null
          concluido_por: string | null
          concluido_por_nome: string | null
          created_at: string
          created_by: string | null
          id: string
          observacao: string
          ordem: number
          ref_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          avaliacao_id?: string | null
          colaborador_id: string
          concluida_em?: string | null
          concluido_por?: string | null
          concluido_por_nome?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          observacao?: string
          ordem?: number
          ref_id?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          avaliacao_id?: string | null
          colaborador_id?: string
          concluida_em?: string | null
          concluido_por?: string | null
          concluido_por_nome?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          observacao?: string
          ordem?: number
          ref_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_atividades_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_historico: {
        Row: {
          acao: string
          colaborador_id: string | null
          created_at: string
          detalhes: Json
          id: string
          user_id: string | null
          user_nome: string | null
        }
        Insert: {
          acao: string
          colaborador_id?: string | null
          created_at?: string
          detalhes?: Json
          id?: string
          user_id?: string | null
          user_nome?: string | null
        }
        Update: {
          acao?: string
          colaborador_id?: string | null
          created_at?: string
          detalhes?: Json
          id?: string
          user_id?: string | null
          user_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_historico_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          campos_extras: Json
          cargo: string
          celula: string
          created_at: string
          created_by: string | null
          data_admissao: string | null
          id: string
          nome_completo: string
          setor: string
          status: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          campos_extras?: Json
          cargo?: string
          celula?: string
          created_at?: string
          created_by?: string | null
          data_admissao?: string | null
          id?: string
          nome_completo: string
          setor?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          campos_extras?: Json
          cargo?: string
          celula?: string
          created_at?: string
          created_by?: string | null
          data_admissao?: string | null
          id?: string
          nome_completo?: string
          setor?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      criterios: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          nome: string
          obrigatorio: boolean
          ordem: number
          peso: number
          secao_id: string | null
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          nome?: string
          obrigatorio?: boolean
          ordem?: number
          peso?: number
          secao_id?: string | null
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          nome?: string
          obrigatorio?: boolean
          ordem?: number
          peso?: number
          secao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criterios_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterios_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "secoes"
            referencedColumns: ["id"]
          },
        ]
      }
      exercicios: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          nome: string
          obrigatorio: boolean
          ordem: number
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          nome?: string
          obrigatorio?: boolean
          ordem?: number
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          nome?: string
          obrigatorio?: boolean
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercicios_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          active: boolean
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          permission_key: string | null
          route: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key: string
          name: string
          permission_key?: string | null
          route: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          permission_key?: string | null
          route?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "modules_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      perfis_comportamentais: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      permission_aliases: {
        Row: {
          legacy_key: string
          permission_key: string
        }
        Insert: {
          legacy_key: string
          permission_key: string
        }
        Update: {
          legacy_key?: string
          permission_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_aliases_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      permissions: {
        Row: {
          action_name: string
          created_at: string
          description: string
          key: string
          module_key: string
          module_name: string
          name: string
          sort_order: number
        }
        Insert: {
          action_name?: string
          created_at?: string
          description?: string
          key: string
          module_key?: string
          module_name?: string
          name: string
          sort_order?: number
        }
        Update: {
          action_name?: string
          created_at?: string
          description?: string
          key?: string
          module_key?: string
          module_name?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      persona_historico: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json
          id: string
          persona_id: string | null
          persona_nome: string | null
          user_id: string | null
          user_nome: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json
          id?: string
          persona_id?: string | null
          persona_nome?: string | null
          user_id?: string | null
          user_nome?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json
          id?: string
          persona_id?: string | null
          persona_nome?: string | null
          user_id?: string | null
          user_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_historico_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_materiais: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          momento: string
          nome: string
          orientacoes: string
          path: string
          persona_id: string | null
          simulacao_id: string | null
          tamanho: number | null
          tipo: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          momento?: string
          nome: string
          orientacoes?: string
          path: string
          persona_id?: string | null
          simulacao_id?: string | null
          tamanho?: number | null
          tipo?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          momento?: string
          nome?: string
          orientacoes?: string
          path?: string
          persona_id?: string | null
          simulacao_id?: string | null
          tamanho?: number | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_materiais_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_materiais_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "simulacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          cidade: string | null
          complexidade: string | null
          contexto_oculto: string | null
          created_at: string
          created_by: string | null
          dados_tecnicos: Json
          encerramento: string | null
          escalada: Json
          exercicio: string | null
          fala_inicial: string | null
          falas_gatilho: Json
          favorita: boolean
          id: string
          idade: string | null
          informacoes_ocultas: Json
          nome: string
          nome_dependente: string | null
          objetivo: string | null
          palavras_chave: string[]
          perfil_comportamental: string[]
          sexo: string | null
          status: string
          tipo_cliente: string | null
          titularidade: string | null
          updated_at: string
          updated_by: string | null
          vertente: string | null
        }
        Insert: {
          cidade?: string | null
          complexidade?: string | null
          contexto_oculto?: string | null
          created_at?: string
          created_by?: string | null
          dados_tecnicos?: Json
          encerramento?: string | null
          escalada?: Json
          exercicio?: string | null
          fala_inicial?: string | null
          falas_gatilho?: Json
          favorita?: boolean
          id?: string
          idade?: string | null
          informacoes_ocultas?: Json
          nome?: string
          nome_dependente?: string | null
          objetivo?: string | null
          palavras_chave?: string[]
          perfil_comportamental?: string[]
          sexo?: string | null
          status?: string
          tipo_cliente?: string | null
          titularidade?: string | null
          updated_at?: string
          updated_by?: string | null
          vertente?: string | null
        }
        Update: {
          cidade?: string | null
          complexidade?: string | null
          contexto_oculto?: string | null
          created_at?: string
          created_by?: string | null
          dados_tecnicos?: Json
          encerramento?: string | null
          escalada?: Json
          exercicio?: string | null
          fala_inicial?: string | null
          falas_gatilho?: Json
          favorita?: boolean
          id?: string
          idade?: string | null
          informacoes_ocultas?: Json
          nome?: string
          nome_dependente?: string | null
          objetivo?: string | null
          palavras_chave?: string[]
          perfil_comportamental?: string[]
          sexo?: string | null
          status?: string
          tipo_cliente?: string | null
          titularidade?: string | null
          updated_at?: string
          updated_by?: string | null
          vertente?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          permission_key: string
          role_key: string
        }
        Insert: {
          id?: string
          permission_key: string
          role_key: string
        }
        Update: {
          id?: string
          permission_key?: string
          role_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string
          is_system: boolean
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          is_system?: boolean
          key: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          is_system?: boolean
          key?: string
          name?: string
        }
        Relationships: []
      }
      secoes: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "secoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulacoes: {
        Row: {
          created_at: string
          created_by: string | null
          exercicio: string | null
          id: string
          nome: string
          observacoes: string | null
          persona_ids: string[]
          responsavel: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exercicio?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          persona_ids?: string[]
          responsavel?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exercicio?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          persona_ids?: string[]
          responsavel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      user_sessions: {
        Row: {
          ended_at: string | null
          id: string
          last_seen_at: string
          started_at: string
          user_agent: string
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          last_seen_at?: string
          started_at?: string
          user_agent?: string
          user_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          last_seen_at?: string
          started_at?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_permission: {
        Args: { _permissions: string[]; _user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      persona_liberada: { Args: { _persona_id: string }; Returns: boolean }
      persona_vinculada: { Args: { _persona_id: string }; Returns: boolean }
      pode_avaliar: { Args: { _user_id: string }; Returns: boolean }
      pode_baixar_material: { Args: { _path: string }; Returns: boolean }
      pode_gerenciar_checklists: {
        Args: { _user_id: string }
        Returns: boolean
      }
      pode_gerenciar_colaboradores: {
        Args: { _user_id: string }
        Returns: boolean
      }
      pode_gerenciar_personas: { Args: { _user_id: string }; Returns: boolean }
      pode_ver_colaboradores: { Args: { _user_id: string }; Returns: boolean }
      simulado_liberado: { Args: { _simulacao_id: string }; Returns: boolean }
      simulado_vinculado: { Args: { _simulacao_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
