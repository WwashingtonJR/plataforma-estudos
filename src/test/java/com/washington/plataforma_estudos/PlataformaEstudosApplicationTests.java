package com.washington.plataforma_estudos;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(properties = {
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"app.catalog.initialize=false",
		"jwt.secret=only-test-ephemeral-key-not-for-deployment-0123456789"
})
class PlataformaEstudosApplicationTests {

	@DynamicPropertySource
	static void isolatedDatabase(DynamicPropertyRegistry properties) {
		String url = System.getenv("TEST_DB_URL");
		if (url == null) {
			properties.add("spring.datasource.url", () ->
					"jdbc:h2:mem:plataforma_context_test;MODE=PostgreSQL;DB_CLOSE_ON_EXIT=FALSE");
			properties.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
			properties.add("spring.datasource.username", () -> "sa");
			properties.add("spring.datasource.password", () -> "");
			return;
		}

		// O Hibernate recria o esquema neste teste. Aceite apenas o banco local dedicado.
		if (!url.matches("jdbc:postgresql://127\\.0\\.0\\.1:[0-9]{1,5}/plataforma_estudos_test")) {
			throw new IllegalArgumentException("TEST_DB_URL deve apontar para o banco local plataforma_estudos_test.");
		}
		String user = System.getenv("TEST_DB_USER");
		String password = System.getenv("TEST_DB_PASSWORD");
		if (user == null || user.isBlank() || password == null || password.isBlank()) {
			throw new IllegalArgumentException("Defina TEST_DB_USER e TEST_DB_PASSWORD para o PostgreSQL de teste.");
		}
		properties.add("spring.datasource.url", () -> url);
		properties.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
		properties.add("spring.datasource.username", () -> user);
		properties.add("spring.datasource.password", () -> password);
	}

	@Test
	void contextLoads() {
	}

}
