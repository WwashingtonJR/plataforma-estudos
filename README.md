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

## Antes de disponibilizar na internet

Hospede a aplicação Spring, que serve o front e a API na mesma origem, com HTTPS e um PostgreSQL configurado por variáveis de ambiente. Use `.env.example` como referência dos nomes. A criação de trilhas, módulos e vídeos exige o papel `ADMIN`.

Veja [a documentação do front](fatecanos-academy/README.md) para rotas, playlists e limitações do progresso.
