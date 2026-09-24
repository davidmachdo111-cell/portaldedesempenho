CREATE INDEX IF NOT EXISTS idx_personas_updated_at ON public.personas (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_personas_biblioteca_filters ON public.personas (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_persona_historico_created_at ON public.persona_historico (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliador_updated_at ON public.avaliacoes (avaliador_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_updated_at ON public.avaliacoes (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_status_updated_at ON public.avaliacoes (status, updated_at DESC);