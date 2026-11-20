package com.washington.plataforma_estudos;

import com.washington.plataforma_estudos.config.CatalogInitializer;
import com.washington.plataforma_estudos.model.Papel;
import com.washington.plataforma_estudos.repository.*;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.MockServletContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import tools.jackson.databind.json.JsonMapper;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class PublicationSecurityTests {
    static final JsonMapper JSON = JsonMapper.builder().build();

    @Test
    void publicationSecurity() throws Exception { check(); }

    // Também permite verificação offline com as dependências já instaladas.
    public static void main(String[] args) throws Exception { check(); }

    static void require(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    static MvcResult status(MvcResult result, int expected) {
        require(result.getResponse().getStatus() == expected,
                result.getRequest().getMethod() + " " + result.getRequest().getRequestURI()
                + ": esperado " + expected + ", recebido " + result.getResponse().getStatus());
        return result;
    }

    static String login(MockMvc mvc, String email) throws Exception {
        MvcResult result = status(mvc.perform(post("/auth/login").contentType("application/json")
                .content(JSON.writeValueAsString(Map.of("email", email, "senha", "Only-Test-123!")))).andReturn(), 200);
        return JSON.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    static void check() throws Exception {
        try (var context = new AnnotationConfigWebApplicationContext()) {
            context.setServletContext(new MockServletContext());
            context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("isolated-test", Map.of(
                    "spring.datasource.url", "jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=PostgreSQL;DB_CLOSE_ON_EXIT=FALSE",
                    "spring.datasource.driver-class-name", "org.h2.Driver",
                    "spring.datasource.username", "sa", "spring.datasource.password", "",
                    "spring.jpa.hibernate.ddl-auto", "create-drop",
                    "jwt.secret", "only-test-ephemeral-secret-1234567890-abcdefghijklmnop",
                    "app.catalog.initialize", "true")));
            context.register(PlataformaEstudosApplication.class);
            context.refresh();
            var seeder = context.getBean(CatalogInitializer.class);
            seeder.run();
            seeder.run();
            var trilhas = context.getBean(TrilhaRepository.class);
            var videos = context.getBean(VideoRepository.class);
            var usuarios = context.getBean(UsuarioRepository.class);
            require(trilhas.count() == 19 && videos.count() == 201, "Carga deve gerar 19 jornadas e 201 cursos, sem duplicar");
            var legada = trilhas.findAll().stream().filter(trilha -> trilha.getNome().equals("GameDev")).findFirst().orElseThrow();
            var personalizada = trilhas.findAll().stream().filter(trilha -> trilha.getNome().equals("Mobile")).findFirst().orElseThrow();
            legada.setDescricao("Jornada de GameDev. Referência: Jornada Dev Herói, de DevArthur.");
            personalizada.setDescricao("Minha descrição personalizada.");
            trilhas.saveAll(java.util.List.of(legada, personalizada));
            seeder.run();
            require(trilhas.findById(legada.getId()).orElseThrow().getDescricao().contains("jogos dos seus sonhos"),
                    "Descrição antiga deve ser substituída");
            require(trilhas.findById(personalizada.getId()).orElseThrow().getDescricao().equals("Minha descrição personalizada."),
                    "Descrição personalizada deve permanecer");

            MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
            status(mvc.perform(get("/health")).andReturn(), 200);
            var index = status(mvc.perform(get("/index.html")).andReturn(), 200);
            require(index.getResponse().getContentAsString().contains("Fatecanos Academy"), "Front deve ser servido pelo Java");
            status(mvc.perform(get("/trilhas")).andReturn(), 401);
            status(mvc.perform(get("/trilhas").header("Authorization", "Bearer invalid-token")).andReturn(), 401);
            status(mvc.perform(post("/auth/cadastro").contentType("application/json").content("{}" )).andReturn(), 400);
            String cadastro = "{\"id\":999,\"nome\":\"Teste\",\"email\":\"one@example.test\",\"senha\":\"Only-Test-123!\",\"papel\":\"ADMIN\"}";
            var created = status(mvc.perform(post("/auth/cadastro").contentType("application/json").content(cadastro)).andReturn(), 200);
            require(!created.getResponse().getContentAsString().contains("senha"), "Resposta não pode revelar senha nem hash");
            var user = usuarios.findByEmail("one@example.test").orElseThrow();
            require(user.getPapel() == Papel.ALUNO && user.getId() != 999, "Cadastro não pode atribuir ADMIN ou ID informado");
            require(user.getSenha().startsWith("$2"), "Senha deve usar BCrypt");
            var duplicated = status(mvc.perform(post("/auth/cadastro").contentType("application/json")
                    .content(cadastro.replace("one@example.test", "ONE@example.test"))).andReturn(), 409);
            require("EMAIL_JA_CADASTRADO".equals(JSON.readTree(duplicated.getResponse().getContentAsString())
                    .path("codigo").asText()), "Cadastro duplicado deve informar o motivo do conflito");
            String token = JSON.readTree(created.getResponse().getContentAsString()).path("token").asText();
            require(!token.isBlank(), "Cadastro deve gerar uma sessão");
            status(mvc.perform(get("/usuarios/me").header("Authorization", "Bearer " + token)).andReturn(), 200);
            status(mvc.perform(get("/trilhas").header("Authorization", "Bearer " + token)).andReturn(), 200);
            for (String route : new String[]{"/trilhas", "/modulos", "/videos"}) {
                status(mvc.perform(post(route).header("Authorization", "Bearer " + token)
                        .contentType("application/json").content("{}")).andReturn(), 403);
            }
            status(mvc.perform(get("/trilhas/admin/teste").header("Authorization", "Bearer " + token)).andReturn(), 403);
            String second = cadastro.replace("one@example.test", "two@example.test");
            status(mvc.perform(post("/auth/cadastro").contentType("application/json").content(second)).andReturn(), 200);
            String secondToken = login(mvc, "two@example.test");
            int videoId = videos.findAll().getFirst().getId();
            status(mvc.perform(post("/progresso/video/" + videoId + "/iniciar").header("Authorization", "Bearer " + token)).andReturn(), 204);
            var active = status(mvc.perform(get("/progresso/em-andamento").header("Authorization", "Bearer " + token)).andReturn(), 200);
            var course = JSON.readTree(active.getResponse().getContentAsString()).get(0);
            require(course != null && course.get("videoId").asInt() == videoId && course.get("trilhaId").asInt() > 0,
                    "Início deve listar o curso aberto com o link para retomada");
            var otherActive = status(mvc.perform(get("/progresso/em-andamento").header("Authorization", "Bearer " + secondToken)).andReturn(), 200);
            require(JSON.readTree(otherActive.getResponse().getContentAsString()).isEmpty(),
                    "Cursos iniciados devem ficar isolados por usuário");
            status(mvc.perform(post("/progresso/video/" + videoId + "/concluir").header("Authorization", "Bearer " + token)).andReturn(), 200);
            var finished = status(mvc.perform(get("/progresso/em-andamento").header("Authorization", "Bearer " + token)).andReturn(), 200);
            require(JSON.readTree(finished.getResponse().getContentAsString()).isEmpty(), "Curso concluído deve sair da lista de retomada");
            var own = status(mvc.perform(get("/progresso/concluidos").header("Authorization", "Bearer " + token)).andReturn(), 200);
            var other = status(mvc.perform(get("/progresso/concluidos").header("Authorization", "Bearer " + secondToken)).andReturn(), 200);
            require(JSON.readTree(own.getResponse().getContentAsString()).size() == 1, "Progresso do aluno deve persistir");
            require(JSON.readTree(other.getResponse().getContentAsString()).isEmpty(), "Outro aluno não pode herdar o progresso");
            status(mvc.perform(options("/trilhas").header("Origin", "https://evil.example.test")
                    .header("Access-Control-Request-Method", "GET")).andReturn(), 403);
            user.setPapel(Papel.ADMIN);
            usuarios.save(user); // Apenas fixture no banco em memória deste teste.
            status(mvc.perform(get("/trilhas/admin/teste").header("Authorization", "Bearer " + token)).andReturn(), 200);
            System.out.println("OK: API integrada, seed sem duplicação, cadastro, BCrypt, JWT inválido, permissões, CORS e isolamento de progresso.");
        }
    }
}
