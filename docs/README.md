# Uni Duni TV

Recomendador pessoal de filmes e séries para quem não sabe o que assistir.
Você arrasta cartões: direita = quero ver, esquerda = não gosto, para cima = já assisti.
O app aprende seu gosto pelos gêneros e temas do que você avalia. Sem IA paga, sem anúncio, sem assinatura.

## Como funciona
- Dados e pôsteres vêm do [TMDB](https://www.themoviedb.org), gratuito para uso pessoal.
- Cada pessoa usa a própria chave do TMDB, salva só no celular. Nenhuma chave fica neste repositório.
- Avaliações, listas e atalhos ficam no celular. Use Perfil > Backup para guardar uma cópia.

## Publicar no GitHub Pages
Settings > Pages > Branch `main`, pasta `/docs` > Save.

## Atualizar
Ao mudar qualquer arquivo, aumente a versão em `docs/sw.js` (linha `VERSION`) para o celular baixar a nova.

Este app usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
