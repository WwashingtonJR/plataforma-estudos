# Fatecanos Academy

Front-end em HTML, CSS e JavaScript para a plataforma de estudos. A interface usa as rotas do projeto `plataforma-estudos` em `http://localhost:8085`.

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
| Progresso | `GET /progresso/concluidos` e `POST /progresso/video/{id}/concluir` |
| Comunidade | `GET /creditos` |
| Perfil | `GET /usuarios/me` e `PUT /usuarios/me` |

`app.js` monta as telas e chama `api()` em `api.js`. O `fetch()` envia os dados do formulário em JSON. Nas rotas protegidas, `api.js` coloca o JWT no cabeçalho `Authorization: Bearer …`. O Java valida o JWT e responde em JSON. A interface renderiza os dados da API como texto.

O token vive na memória da página. Atualizar a aba encerra a sessão local. O progresso vem da API e é atualizado após confirmação do Java. O player aceita URLs do YouTube e monta o iframe com o domínio `www.youtube-nocookie.com`.

## Antes de publicar

- Limite os `POST` de `/trilhas`, `/modulos` e `/videos` a administradores no Spring Security. A regra precisa vir antes de `.anyRequest().authenticated()`. Verifique as permissões usando contas de teste `ALUNO` e `ADMIN`.
- Configure o domínio HTTPS da API em `api.js` e em `connect-src` no `index.html` e no `_headers`. No CORS do Java, autorize o domínio HTTPS exato do front. Mantenha os segredos no ambiente do servidor Java.


## Catálogo de jornadas

19 jornadas de carreira, na ordem da referência, começando em Back End. São 201 cursos/materiais e 146 links distintos. Os percursos acadêmicos não foram importados. Consulte `CATALOGO-DE-CURSOS.txt` e `catalogo-jornadas.json`. A relação com os IDs persistidos no Java está em `importacao-jornadas.json`.

Playlists usam o player incorporado do YouTube; a lista de aulas fica na lateral da página, com seleção direta e botões para aula anterior/próxima. O botão **Concluir curso** registra a conclusão da playlist/curso inteiro. Não há acompanhamento automático de cada vídeo nem retomada do minuto assistido. Materiais fora do YouTube abrem no site do autor, com identificação na interface.

`media.js` valida URLs, e `course-sources.js` registra a ordem e os metadados conferidos. `api.js` continua consumindo o Java em 8085. Atualize a página depois de alterar os arquivos. `playlist-lessons.js` contém os títulos e IDs públicos das aulas, sem baixar os vídeos.

Para iniciar o front sem VS Code, execute `iniciar-front.cmd` nesta pasta (requer o Node.js já instalado). O servidor local usa http://127.0.0.1:5500 e fica ativo enquanto a janela estiver aberta. Se a porta já estiver em uso, abra o endereço existente. O Java permanece iniciado pelo IntelliJ.
