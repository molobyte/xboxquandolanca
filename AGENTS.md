# Diretrizes do Projeto (Xbox Quando Lança)

## Regra de Git Obrigatória
Sempre que você realizar qualquer alteração, ajuste ou nova funcionalidade solicitada pelo usuário no código:
1. Certifique-se de validar o build com `npm.cmd run build` (ou `npm run build`) para garantir que não há erros de compilação ou sintaxe.
2. Adicione os arquivos alterados ao Git (`git add .` ou os arquivos específicos relevantes).
3. Crie um commit com mensagem clara e objetiva sobre o que foi feito.
4. Envie imediatamente o commit para a branch `main` no repositório remoto (`git push origin main`).
