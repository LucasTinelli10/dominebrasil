
# Corrigir envio de mensagens no chat de solicitações

## Problema
Ao clicar em "Enviar" no chat da tela de solicitações do instrutor, a mensagem nao e enviada. O erro esta sendo silenciosamente ignorado sem feedback ao usuario.

## Causa raiz
Dois problemas identificados:

1. **Erro silencioso**: A funcao `handleSendMessage` captura erros mas nao mostra nenhum feedback ao usuario. Se o insert falhar (por RLS ou dados invalidos), nada acontece.

2. **Possivel `receiver_id` nulo**: O campo `selectedRequest.student?.id` pode estar vindo como `undefined` dependendo de como o Supabase retorna o join. O cast `as unknown as LessonRequest[]` na linha 70 esconde problemas de tipo.

## Plano de correcao

### 1. Adicionar logs e feedback de erro no `handleSendMessage`
- Adicionar `console.log` para verificar o `receiver_id` antes do insert
- Adicionar `toast.error()` quando o envio falhar
- Tratar o caso onde `error` existe (atualmente so processa se `!error && data`)

### 2. Garantir acesso correto ao ID do aluno
- Adicionar verificacao explicita se `selectedRequest.student?.id` existe antes de tentar enviar
- Mostrar toast de erro caso o ID do aluno nao esteja disponivel

### 3. Adicionar feedback visual
- Mostrar toast de erro se a mensagem nao puder ser enviada
- Garantir que o usuario saiba quando algo deu errado

## Detalhes tecnicos

Arquivo: `src/pages/app/instructor/InstructorRequests.tsx`

Modificacoes na funcao `handleSendMessage` (linhas 142-163):
- Verificar se `selectedRequest.student?.id` existe, e se nao existir, mostrar toast
- Logar o erro do Supabase com `toast.error` ao inves de apenas `console.error`
- Adicionar fallback: se `student?.id` nao funcionar, usar `student_id` diretamente do booking via query adicional
