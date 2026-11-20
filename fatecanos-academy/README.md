# Fatecanos Academy

Front-end em HTML, CSS e JavaScript para a plataforma de estudos. O Spring serve a interface e a API no mesmo endereço. Em desenvolvimento, o front na porta 5500 chama a API em `http://localhost:8085`.

## Rodar no Windows

1. No IntelliJ, inicie `PlataformaEstudosApplication` com o PostgreSQL ativo e as variáveis `DB_PASSWORD` e `JWT_SECRET` na configuração de execução do Java.
2. No VS Code, abra esta pasta e use **Open with Live Server** no `index.html`. Abra `http://127.0.0.1:5500/`. A porta `5500` é uma das origens liberadas no `SecurityConfig`.
3. Cadastre uma conta, entre, abra uma trilha com aulas cadastradas, conclua uma aula e edite o perfil. Para conferir a persistência, saia, entre novamente e abra a mesma trilha e o perfil.

## Onde o front chama o Java

| Tela | Rotas |
| --- | --- |
| Cadastro e login | `POST /auth/cadastro` e `POST /auth/login` |
| Catálogo | `GET /trilhas` |
| Trilha e módulos | `GET /trilhas/{id}`, `GET /modulos/trilha/{id}`, `GET /videos/trilha/{id}/introducao` e `GET /videos/modulo/{id}` |
| Progresso | `GET /progresso/concluidos`, `POST /progresso/video/{id}/concluir`, `GET /progresso/video/{id}/aulas` e `PUT /progresso/video/{id}/aulas/{aulaId}` |
| Comunidade | `GET /creditos` |
| Perfil | `GET /usuarios/me` e `PUT /usuarios/me` |

`app.js` monta as telas e chama `api()` em `api.js`. O `fetch()` envia os dados do formulário em JSON. Nas rotas protegidas, `api.js` coloca o JWT no cabeçalho `Authorization: Bearer …`. O Java valida o JWT e responde em JSON. A interface renderiza os dados da API como texto.

O token vive na memória da página. Atualizar a aba encerra a sessão local. O progresso vem da API e é atualizado após confirmação do Java. O player aceita URLs do YouTube e monta o iframe com o domínio `www.youtube-nocookie.com`.

## Antes de publicar

Sirva o front e a API juntos pelo Spring em um endereço HTTPS. O `api.js` usa a origem da página e o Spring restringe a escrita do catálogo ao papel `ADMIN`. Configure os segredos no ambiente do servidor Java.


## Catálogo de jornadas

O Início traz notícias, cursos em andamento, perfil e calendário. Em `editorial.js`, liste as notícias na ordem do carrossel com título, tópico, resumo, data de publicação no formato `AAAA-MM-DD`, fonte, link e texto do botão. O carrossel mostra as notícias da semana a partir da segunda-feira e aceita uma data final opcional em `until` para avisos que precisam continuar visíveis. Para uma notícia também aparecer em Próximas datas, inclua `event` com `date` e `label`.

19 jornadas de carreira, na ordem da referência, começando em Back End. São 201 cursos/materiais e 146 links distintos. Os percursos acadêmicos não foram importados. Consulte `CATALOGO-DE-CURSOS.txt` e `catalogo-jornadas.json`. A relação com os IDs persistidos no Java está em `importacao-jornadas.json`.

Playlists com aulas catalogadas mostram a lista ao lado do player. **Concluir aula** salva cada aula na conta. Ao voltar ao curso, a página abre na primeira aula pendente. Em playlists com a lista completa, a última conclusão encerra o curso automaticamente. Materiais fora do YouTube abrem no site do autor.

`media.js` valida URLs, e `course-sources.js` registra a ordem e os metadados conferidos. O front e a API usam os mesmos títulos e IDs públicos em `playlist-lessons.json`.

Para iniciar o front sem VS Code, execute `iniciar-front.cmd` nesta pasta (requer o Node.js já instalado). O servidor local usa http://127.0.0.1:5500 e fica ativo enquanto a janela estiver aberta. Se a porta já estiver em uso, abra o endereço existente. O Java permanece iniciado pelo IntelliJ.
