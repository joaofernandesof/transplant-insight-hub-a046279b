-- Drop ALL RLS policies on avivar_conversas (all possible names)
DROP POLICY IF EXISTS "Users can view own conversations" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Service role can manage all conversations" ON public.avivar_conversas;

-- Drop ALL RLS policies on avivar_mensagens (all possible names)
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can view messages to own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can insert messages to own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can update messages to own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can delete messages to own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.avivar_mensagens;