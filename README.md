# Fatecanos Academy — plataforma de estudos

API Java com Spring Boot e PostgreSQL, com front-end em HTML, CSS e JavaScript.
O catálogo de referência reúne 19 jornadas de carreira e 201 cursos/materiais, com créditos aos autores. Percursos acadêmicos não fazem parte do catálogo.

## Executar localmente

1. Instale Java 21 ou superior, PostgreSQL e Node.js 22 ou superior.
2. Crie o banco `plataforma_estudos` e configure `DB_PASSWORD` e `JWT_SECRET` no ambiente de execução do Java. Use uma chave JWT aleatória de pelo menos 32 bytes; não versione os valores.
3. Inicie `PlataformaEstudosApplication` pelo IntelliJ, ou execute `mvnw.cmd spring-boot:run` no Windows. A API usa a porta 8085.
4. Abra http://localhost:8085/ para acessar o front servido pelo Spring. Durante o desenvolvimento do front, também é possível executar `fatecanos-academy/iniciar-front.cmd` e abrir http://127.0.0.1:5500/.
5. Cadastre sua conta pela interface.

Em um banco vazio, inicie o Java com `INIT_CATALOG=true` para carregar as jornadas de `fatecanos-academy/catalogo-jornadas.json`. Depois da primeira carga, desative a opção. O arquivo `importacao-jornadas.json` registra IDs de uma importação local. Cada banco gera seus próprios IDs.

## Testes

Execute `node tests/frontend.test.mjs` para verificar os fluxos do front com API simulada: cadastro, login, perfil, progresso, navegação de aulas e validação de URLs. O teste não reproduz vídeos nem substitui uma conferência no navegador.

No Windows, execute `.\mvnw.cmd verify` para rodar os testes do back-end e empacotar a aplicação. No Linux ou macOS, use `./mvnw verify`. Os testes usam H2 em memória por padrão e verificam a inicialização do Spring, a carga do catálogo, cadastro, autenticação, permissões e isolamento do progresso.

O GitHub Actions também verifica a inicialização com PostgreSQL descartável. Para repetir essa verificação localmente, defina `TEST_DB_URL` no formato `jdbc:postgresql://127.0.0.1:<porta>/plataforma_estudos_test` e forneça `TEST_DB_USER` e `TEST_DB_PASSWORD` exclusivos do teste. O teste recria o esquema nesse banco. A suíte de API continua em H2.

Com Docker em modo Linux e Node.js 22 ou superior, execute `node tests/docker-smoke.mjs` na raiz. O teste constrói a imagem, inicia um PostgreSQL 18 descartável sem publicar a porta do banco e confere a API, o catálogo e o progresso após reiniciar a aplicação. O GitHub Actions usa o mesmo comando.

## Entrar com Google

Crie um cliente OAuth do tipo **Aplicativo da Web** no Google Auth Platform. Cadastre como URI de redirecionamento o endereço da aplicação com o caminho `/login/oauth2/code/google`. Para a prévia local, use `http://127.0.0.1:18085/login/oauth2/code/google`. Se o app do Google estiver em teste, inclua as contas autorizadas na lista de usuários de teste.

Defina `GOOGLE_LOGIN_ENABLED=true`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI` no ambiente do servidor. Em HTTPS, configure também `SERVER_SERVLET_SESSION_COOKIE_SECURE=true`. A interface e a API precisam estar no mesmo domínio e porta para o login com Google. Contas já criadas por e-mail continuam entrando com a senha.

## Hospedar no Render com PostgreSQL do Supabase

1. Crie um projeto **Free** no Supabase. Em **Integrations → Data API**, desligue **Enable Data API**. A aplicação usa a conexão PostgreSQL pelo Spring. [Documentação do Supabase](https://supabase.com/docs/guides/api/securing-your-api#disable-the-data-api)
2. No **SQL Editor** desse projeto, execute `CREATE SCHEMA IF NOT EXISTS academy;`. Depois abra **Connect**, selecione **Session pooler** e copie o host e o usuário exibidos. [Conexão PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres#shared-pooler-session-mode)
3. No Render, crie um **Blueprint** conectado à branch do GitHub que contém `render.yaml`. O Blueprint cria um serviço Docker **Free** e gera a chave JWT. [Render Blueprints](https://render.com/docs/infrastructure-as-code)
4. No formulário do Render, preencha as três variáveis abaixo. Use o host e o usuário da tela **Session pooler** e a senha de banco escolhida no Supabase.

   | Variável | Valor |
   | --- | --- |
   | `DB_URL` | `jdbc:postgresql://HOST_DO_POOLER:5432/postgres?sslmode=require&currentSchema=academy` |
   | `DB_USER` | `postgres.REFERENCIA_DO_PROJETO` |
   | `DB_PASSWORD` | Senha do banco do Supabase |

O endereço HTTPS do Render serve o site e a API. O Spring cria as tabelas no esquema `academy` e carrega o catálogo quando ele está vazio. Os cadastros, o progresso e os projetos da prévia local pertencem ao banco local. Cadastre a conta de moderação no site publicado para liberar a revisão no banco hospedado.

O serviço gratuito do Render dorme após 15 minutos sem tráfego e pode demorar no primeiro acesso. O Supabase Free pode pausar o banco após uma semana de baixa atividade. Para manter a hospedagem dentro do gratuito, escolha os planos **Free** e use o Render sem adicionar forma de pagamento. [Limites do Render](https://render.com/docs/free) · [Pausa no Supabase](https://supabase.com/docs/guides/platform/free-project-pausing)

Veja [a documentação do front](fatecanos-academy/README.md) para rotas, playlists e limitações do progresso.
