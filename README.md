# Fatecanos Academy — plataforma de estudos

API Java com Spring Boot e PostgreSQL, com front-end em HTML, CSS e JavaScript.
O catálogo de referência reúne 19 jornadas de carreira e 201 cursos/materiais, com créditos aos autores. Percursos acadêmicos não fazem parte do catálogo.

## Executar localmente

1. Instale Java 21 ou superior, PostgreSQL e Node.js 22 ou superior.
2. Crie o banco `plataforma_estudos` e configure `DB_PASSWORD` e `JWT_SECRET` no ambiente de execução do Java. Use uma chave JWT aleatória de pelo menos 32 bytes; não versione os valores.
3. Inicie `PlataformaEstudosApplication` pelo IntelliJ, ou execute `mvnw.cmd spring-boot:run` no Windows. A API usa a porta 8085.
4. Execute `fatecanos-academy/iniciar-front.cmd` e abra http://127.0.0.1:5500/.
5. Cadastre sua conta pela interface.

O banco de dados local e as contas não são enviados ao GitHub. Um banco novo começa sem as trilhas cadastradas. `fatecanos-academy/catalogo-jornadas.json` contém o catálogo de referência; `importacao-jornadas.json` documenta os IDs da importação local, que não devem ser presumidos em outro banco.

## Testes

Execute `node tests/frontend.test.mjs` para verificar os fluxos do front com API simulada: cadastro, login, perfil, progresso, navegação de aulas e validação de URLs. O teste não reproduz vídeos nem substitui uma conferência no navegador.

O GitHub Actions executa os testes do front e `mvn verify` do back-end com PostgreSQL descartável. As credenciais declaradas no workflow são exclusivas desse banco temporário. O teste atual do Java verifica a inicialização do contexto; não representa cobertura completa das regras da API.

## Antes de disponibilizar na internet

Enviar código ao GitHub não hospeda a aplicação. Configure API, banco e front em serviços de hospedagem, HTTPS, CORS e variáveis de ambiente. Antes de expor a API, restrinja as operações de criação de trilhas, módulos e vídeos a administradores. Essa restrição ainda é pendente na configuração atual.

Veja [a documentação do front](fatecanos-academy/README.md) para rotas, playlists e limitações do progresso.
