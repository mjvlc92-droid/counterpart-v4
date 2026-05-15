import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
// Agent runs on a fixed port regardless of frontend port
const AGENT_URL = process.env.AGENT_URL || BASE_URL.replace(/:\d+/, ":2024");

const SAMPLE_INPUT = `
Juan es director de procurement de una corporación de 500 empleados.
En reuniones anteriores ha citado el reglamento interno tres veces antes de responder cualquier pregunta.
Siempre llega con un checklist impreso. Nunca toma decisiones en la sala — siempre dice que lo tiene que
presentar al comité. Cuando se le pregunta sobre plazos, responde con el calendario de reuniones del directorio.
Habla lento, toma notas a mano, y evita el contacto visual cuando se le presiona sobre deadlines.
`;

const SPARRING_MESSAGES = [
  "Entendemos que su proceso requiere varios pasos de validación. Hemos preparado toda la documentación necesaria para el comité.",
  "Podemos estructurar la propuesta exactamente según su protocolo interno. ¿Cuál es el formato que prefiere el comité?",
];

// Main form textarea has rows=8 to distinguish from CopilotKit sidebar (rows=1)
const FORM_TEXTAREA = "textarea[rows='8']";

// ── Test Suite 1: Form and Archetype Detection ────────────────────────────────

test.describe("Form and Archetype Detection", () => {
  test("renders the form correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("text=Nueva sesión")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(FORM_TEXTAREA)).toBeVisible();
  });

  test("submit button disabled until form is complete", async ({ page }) => {
    await page.goto(BASE_URL);
    const button = page.locator("button[type=submit]");
    await expect(button).toBeDisabled();

    await page.locator(FORM_TEXTAREA).fill(SAMPLE_INPUT.trim());
    await expect(button).toBeDisabled(); // Still missing objective + role

    await page.locator("input[placeholder*='objetivo' i]").fill("Cerrar contrato anual");
    await expect(button).toBeDisabled(); // Still missing role

    await page.locator("input[placeholder*='rol' i]").fill("Vendedor B2B");
    await expect(button).toBeEnabled();
  });

  test("golden path: form → archetype detection", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.locator(FORM_TEXTAREA).fill(SAMPLE_INPUT.trim());
    await page.locator("input[placeholder*='objetivo' i]").fill("Cerrar contrato anual");
    await page.locator("input[placeholder*='rol' i]").fill("Vendedor B2B");
    await page.locator("button[type=submit]").click();

    // Wait for archetype to appear (agent processing)
    await expect(page.locator("text=Entrenamiento activo").or(page.locator("text=CONTROL")).or(page.locator("text=PODER")).first()).toBeVisible({
      timeout: 30000,
    });
  });
});

// ── Test Suite 2: Sparring Chat ───────────────────────────────────────────────

test.describe("Sparring Chat UI", () => {
  async function setupSparring(page: Page) {
    await page.goto(BASE_URL);
    // Use demo mode indicators or check if training controls appear
    await page.locator(FORM_TEXTAREA).fill(SAMPLE_INPUT.trim());
    await page.locator("input[placeholder*='objetivo' i]").fill("Aprobar partnership comercial");
    await page.locator("input[placeholder*='rol' i]").fill("Consultor");
    await page.locator("button[type=submit]").click();
    // Wait for training to start
    await expect(page.locator("text=Entrenamiento activo").first()).toBeVisible({ timeout: 30000 });
  }

  test("sparring input is visible during training", async ({ page }) => {
    await setupSparring(page);
    await expect(page.locator("textarea[placeholder*='argumento' i]")).toBeVisible();
  });

  test("user can send a sparring message", async ({ page }) => {
    await setupSparring(page);

    const input = page.locator("textarea[placeholder*='argumento' i]");
    await input.fill(SPARRING_MESSAGES[0]);
    await page.keyboard.press("Enter");

    // User message should appear
    await expect(page.locator(`text=${SPARRING_MESSAGES[0].slice(0, 30)}`)).toBeVisible({ timeout: 5000 });
  });

  test("training controls show end session button", async ({ page }) => {
    await setupSparring(page);
    await expect(page.locator("text=Terminar sesión").first()).toBeVisible();
  });

  test("end training button triggers scorecard", async ({ page }) => {
    await setupSparring(page);
    await page.locator("text=Terminar sesión").first().click();
    await expect(page.locator("text=Sesión completada").or(page.locator("text=/100/")).first()).toBeVisible({ timeout: 30000 });
  });
});

// ── Test Suite 3: Tree Panel ──────────────────────────────────────────────────

test.describe("Probability Tree Panel", () => {
  test("tree panel is present on the page", async ({ page }) => {
    await page.goto(BASE_URL);
    // Tree panel should be visible in the layout
    await expect(page.locator("text=El árbol aparecerá tras el análisis").or(page.locator("text=Árbol de probabilidades"))).toBeVisible({ timeout: 10000 });
  });
});

// ── Test Suite 4: Mode States ─────────────────────────────────────────────────

test.describe("Mode State Machine", () => {
  test("starts in idle mode", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("text=Completa el formulario para comenzar")).toBeVisible({ timeout: 10000 });
  });

  test("new session button resets state after complete", async ({ page }) => {
    await page.goto(BASE_URL);

    // Submit form
    await page.locator(FORM_TEXTAREA).fill(SAMPLE_INPUT.trim());
    await page.locator("input[placeholder*='objetivo' i]").fill("Validar pilot");
    await page.locator("input[placeholder*='rol' i]").fill("BizDev");
    await page.locator("button[type=submit]").click();

    await expect(page.locator("text=Entrenamiento activo").first()).toBeVisible({ timeout: 30000 });
    await page.locator("text=Terminar sesión").first().click();
    await expect(page.locator("text=Nueva sesión")).toBeVisible({ timeout: 30000 });

    // Click new session
    await page.locator("button:has-text('Nueva sesión')").click();
    await expect(page.locator("text=Nueva sesión").first()).toBeVisible({ timeout: 10000 });
  });
});

// ── Test Suite 5: Demo Mode ───────────────────────────────────────────────────

test.describe("Demo Mode Fallback", () => {
  test("health endpoint responds", async ({ page }) => {
    const response = await page.request.get(`${AGENT_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});
